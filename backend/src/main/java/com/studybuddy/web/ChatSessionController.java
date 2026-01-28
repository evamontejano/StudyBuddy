package com.studybuddy.web;

import com.studybuddy.domain.ChatMessage;
import com.studybuddy.domain.ChatSession;
import com.studybuddy.dto.ChatHistoryResponse;
import com.studybuddy.dto.ChatMessageDTO;
import com.studybuddy.dto.ChatSessionRequest;
import com.studybuddy.dto.ChatSessionResponse;
import com.studybuddy.repository.ChatMessageRepository;
import com.studybuddy.repository.ChatSessionRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/sessions")
@Slf4j
public class ChatSessionController {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;

    public ChatSessionController(ChatSessionRepository sessionRepo, ChatMessageRepository messageRepo) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
    }

    @PostMapping
    public ResponseEntity<ChatSessionResponse> createSession(@Valid @RequestBody ChatSessionRequest request) {
        log.info("Creating new chat session for userId={}", request.getUserId());

        ChatSession session = ChatSession.builder()
                .userId(request.getUserId())
                .title(request.getTitle() != null ? request.getTitle() : "New Chat")
                .build();

        session = sessionRepo.save(session);

        ChatSessionResponse response = ChatSessionResponse.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ChatSessionResponse>> getUserSessions(@RequestParam Long userId) {
        log.info("Fetching chat sessions for userId={}", userId);

        List<ChatSession> sessions = sessionRepo.findByUserIdOrderByUpdatedAtDesc(userId);

        List<ChatSessionResponse> response = sessions.stream()
                .map(session -> ChatSessionResponse.builder()
                        .id(session.getId())
                        .userId(session.getUserId())
                        .title(session.getTitle())
                        .createdAt(session.getCreatedAt())
                        .updatedAt(session.getUpdatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{sessionId}/history")
    public ResponseEntity<ChatHistoryResponse> getSessionHistory(@PathVariable Long sessionId) {
        log.info("Fetching chat history for sessionId={}", sessionId);

        if (!sessionRepo.existsById(sessionId)) {
            log.warn("Session {} not found", sessionId);
            return ResponseEntity.notFound().build();
        }

        List<ChatMessage> messages = messageRepo.findBySessionIdOrderByTimestampAsc(sessionId);

        List<ChatMessageDTO> messageDtos = messages.stream()
                .map(msg -> ChatMessageDTO.builder()
                        .id(msg.getId())
                        .userId(msg.getUserId())
                        .sessionId(msg.getSessionId())
                        .role(msg.getRole())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .build())
                .toList();

        ChatHistoryResponse response = ChatHistoryResponse.builder()
                .sessionId(sessionId)
                .messages(messageDtos)
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{sessionId}")
    @Transactional
    public ResponseEntity<Void> deleteSession(@PathVariable Long sessionId) {
        log.info("Deleting session {} and all its messages", sessionId);

        if (!sessionRepo.existsById(sessionId)) {
            log.warn("Session {} not found", sessionId);
            return ResponseEntity.notFound().build();
        }

        messageRepo.deleteBySessionId(sessionId);
        sessionRepo.deleteById(sessionId);

        log.info("Successfully deleted session {} and its messages", sessionId);
        return ResponseEntity.noContent().build();
    }
}
