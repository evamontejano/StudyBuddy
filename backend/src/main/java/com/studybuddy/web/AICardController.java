package com.studybuddy.web;

import com.studybuddy.ai.BedrockService;
import com.studybuddy.domain.AICard;
import com.studybuddy.domain.AICardType;
import com.studybuddy.domain.Lesson;
import com.studybuddy.repository.AICardRepository;
import com.studybuddy.repository.LessonRepository;
import com.studybuddy.dto.QuizCheckRequest;
import com.studybuddy.dto.QuizCheckResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.env.Environment;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@lombok.extern.slf4j.Slf4j
public class AICardController {

    private final LessonRepository lessonRepository;
    private final AICardRepository aiCardRepository;
    private final Optional<ChatModel> chatModel;
    private final BedrockService bedrockService;
    private final Environment env;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AICardController(LessonRepository lessonRepository, AICardRepository aiCardRepository,
                            Optional<ChatModel> chatModel, BedrockService bedrockService, Environment env) {
        this.lessonRepository = lessonRepository;
        this.aiCardRepository = aiCardRepository;
        this.chatModel = chatModel;
        this.bedrockService = bedrockService;
        this.env = env;
    }

    @PostMapping("/lessons/{id}/generate")
    public ResponseEntity<?> generate(@PathVariable Long id) {
        log.info("Generating AI cards for lesson id={}", id);
        Optional<Lesson> opt = lessonRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (chatModel.isEmpty() && !bedrockService.isEnabled()) {
            return ResponseEntity.status(503)
                    .header("X-AI-Model", "none")
                    .body("AI service is not available. Please try again later.");
        }
        Lesson lesson = opt.get();
        String text = lesson.getExtractedContent() == null ? "" : lesson.getExtractedContent();

        var existing = aiCardRepository.findByLessonIdOrderByIdAsc(id);
        if (!existing.isEmpty()) {
            aiCardRepository.deleteAll(existing);
        }

        List<AICard> toSave = new ArrayList<>();

        try {
            String summaryPrompt = "Summarize the following material in under 150 words in a student-friendly tone:\n" + text;
            String summary = callAI(summaryPrompt);
            toSave.add(AICard.builder().lessonId(id).type(AICardType.SUMMARY).content(summary).build());

            String notesPrompt = "Extract the key concepts, definitions, and formulas from the following material as bullet points (max 10):\n" + text;
            String notes = callAI(notesPrompt);
            toSave.add(AICard.builder().lessonId(id).type(AICardType.KEY_NOTES).content(notes).build());

            String flashcardPrompt = "Create 5 multiple-choice questions (MCQ) to test understanding of the following material. For each question, provide exactly three options (two incorrect, one correct). Respond ONLY with a raw JSON array. Each element must be an object with fields: 'question' (string), 'options' (array of exactly 3 strings), and 'correctIndex' (number 0..2 indicating the correct option). No markdown, no extra text.\n" + text;
            String flashcardsJson = callAI(flashcardPrompt);
            try {
                List<java.util.Map<String, Object>> items = objectMapper.readValue(
                        flashcardsJson, new TypeReference<List<java.util.Map<String, Object>>>() {}
                );
                for (int i = 0; i < items.size(); i++) {
                    items.get(i).put("questionIndex", i);
                }
                flashcardsJson = objectMapper.writeValueAsString(items);
            } catch (Exception e) {
                log.warn("Failed to post-process flashcards JSON to add questionIndex: {}", e.getMessage());
            }
            toSave.add(AICard.builder().lessonId(id).type(AICardType.QA_FLASHCARDS).content(flashcardsJson).build());
        } catch (Exception ex) {
            String model = "unknown";
            try { model = env.getProperty("spring.ai.ollama.chat.options.model", "unknown"); } catch (Exception ignore) {}
            return ResponseEntity.status(503)
                    .header("X-AI-Model", model)
                    .body("AI service error: " + ex.getMessage());
        }

        var saved = aiCardRepository.saveAll(toSave);
        String model = env.getProperty("spring.ai.ollama.chat.options.model", "unknown");
        return ResponseEntity.ok()
                .header("X-AI-Model", model)
                .body(saved);
    }


    @GetMapping("/lessons/{id}/cards")
    public ResponseEntity<List<AICard>> getCards(@PathVariable Long id) {
        return ResponseEntity.ok(aiCardRepository.findByLessonIdOrderByIdAsc(id));
    }

    @PostMapping("/lessons/{id}/quiz/check")
    public ResponseEntity<?> checkQuizAnswer(@PathVariable Long id, @RequestBody QuizCheckRequest req) {
        try {
            var cards = aiCardRepository.findByLessonIdAndType(id, AICardType.QA_FLASHCARDS);
            if (cards.isEmpty()) {
                return ResponseEntity.badRequest().body("No quiz found. Generate cards first.");
            }
            String json = cards.get(0).getContent();
            List<QuizItem> items = objectMapper.readValue(json, new TypeReference<List<QuizItem>>(){});
            int qIdx = req.getQuestionIndex();
            int sel = req.getSelectedIndex();
            if (qIdx < 0 || qIdx >= items.size()) {
                return ResponseEntity.badRequest().body("questionIndex out of range");
            }
            if (sel < 0 || sel > 2) {
                return ResponseEntity.badRequest().body("selectedIndex must be 0,1,2");
            }
            int correct = items.get(qIdx).getCorrectIndex();
            QuizCheckResponse resp = new QuizCheckResponse();
            resp.setCorrect(sel == correct);
            resp.setCorrectIndex(correct);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid quiz format or request: " + e.getMessage());
        }
    }

    /** Use Ollama if available, otherwise fall back to Amazon Bedrock. */
    private String callAI(String prompt) {
        if (chatModel.isPresent()) {
            try {
                return chatModel.get().call(prompt);
            } catch (Exception ex) {
                log.warn("Ollama call failed, falling back to Bedrock: {}", ex.getMessage());
            }
        }
        return bedrockService.call(prompt);
    }

    // Minimal DTO for parsing quiz
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class QuizItem {
        private String question;
        private List<String> options;
        private int correctIndex;
        private Integer questionIndex;
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
        public int getCorrectIndex() { return correctIndex; }
        public void setCorrectIndex(int correctIndex) { this.correctIndex = correctIndex; }
        public Integer getQuestionIndex() { return questionIndex; }
        public void setQuestionIndex(Integer questionIndex) { this.questionIndex = questionIndex; }
    }
}
