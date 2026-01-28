package com.studybuddy.web;

import com.studybuddy.domain.ChatMessage;
import com.studybuddy.domain.ChatSession;
import com.studybuddy.domain.Lesson;
import com.studybuddy.dto.ChatRequest;
import com.studybuddy.dto.ChatResponse;
import com.studybuddy.repository.ChatMessageRepository;
import com.studybuddy.repository.ChatSessionRepository;
import com.studybuddy.repository.LessonRepository;
import jakarta.validation.Valid;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.env.Environment;

import java.util.Optional;

@RestController
@RequestMapping("/api")
@lombok.extern.slf4j.Slf4j
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final ChatSessionRepository sessionRepo;
    private final LessonRepository lessonRepo;
    private final Optional<ChatModel> chatModel;
    private final Environment env;

    public ChatController(ChatMessageRepository chatRepo, ChatSessionRepository sessionRepo,
                         LessonRepository lessonRepo, Optional<ChatModel> chatModel, Environment env) {
        this.chatRepo = chatRepo;
        this.sessionRepo = sessionRepo;
        this.lessonRepo = lessonRepo;
        this.chatModel = chatModel;
        this.env = env;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest req) {
        log.info("Chat request from userId={}, lessonId={}, sessionId={}", req.getUserId(), req.getLessonId(), req.getSessionId());

        Long sessionId = req.getSessionId();
        if (sessionId == null) {
            ChatSession newSession = ChatSession.builder()
                    .userId(req.getUserId())
                    .title("Chat Session")
                    .build();
            newSession = sessionRepo.save(newSession);
            sessionId = newSession.getId();
            log.info("Auto-created new chat session with ID={} for userId={}", sessionId, req.getUserId());
        } else {
            sessionRepo.findById(sessionId).ifPresent(session -> {
                session.setUpdatedAt(java.time.LocalDateTime.now());
                sessionRepo.save(session);
            });
        }

        ChatMessage userMsg = ChatMessage.builder()
                .userId(req.getUserId())
                .sessionId(sessionId)
                .role("user")
                .content(req.getMessage())
                .build();
        chatRepo.save(userMsg);

        String replyText;
        boolean aiAvailable = chatModel.isPresent();
        if (aiAvailable) {
            try {
                String prompt = buildPromptWithContext(req);

                replyText = chatModel.get().call(prompt);
            } catch (Exception ex) {
                replyText = "AI service error: " + ex.getMessage();
                aiAvailable = false;
            }
        } else {
            replyText = "AI service is not available right now. Please try again later.";
        }
        
        ChatMessage botMsg = ChatMessage.builder()
                .userId(req.getUserId())
                .sessionId(sessionId)
                .role("assistant")
                .content(replyText)
                .build();
        chatRepo.save(botMsg);

        ChatResponse resp = new ChatResponse();
        resp.setReply(replyText);
        resp.setSessionId(sessionId);
        String model = aiAvailable ? env.getProperty("spring.ai.ollama.chat.options.model", "unknown") : "none";
        return ResponseEntity.ok()
                .header("X-AI-Model", model)
                .body(resp);
    }

    private String buildPromptWithContext(ChatRequest req) {
        if (req.getLessonId() == null) {
            return req.getMessage();
        }

        Optional<Lesson> lessonOpt = lessonRepo.findById(req.getLessonId());
        if (lessonOpt.isEmpty()) {
            log.warn("Lesson ID {} not found, proceeding without context", req.getLessonId());
            return req.getMessage();
        }

        Lesson lesson = lessonOpt.get();
        String extractedContent = lesson.getExtractedContent();

        if (extractedContent == null || extractedContent.trim().isEmpty()) {
            log.warn("Lesson ID {} has no extracted content", req.getLessonId());
            return req.getMessage();
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a helpful tutor assistant. The student is studying the following lesson:\n\n");
        prompt.append("=== LESSON: ").append(lesson.getTitle()).append(" ===\n");
        prompt.append(extractedContent);
        prompt.append("\n\n=== END OF LESSON ===\n\n");
        prompt.append("Based on the lesson content above, please answer the following question:\n");
        prompt.append(req.getMessage());

        log.info("Built context-aware prompt for lesson '{}' (ID: {})", lesson.getTitle(), lesson.getId());
        return prompt.toString();
    }
}
