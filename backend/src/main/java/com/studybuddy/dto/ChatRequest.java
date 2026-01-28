package com.studybuddy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequest {
    @NotNull
    private Long userId;
    @NotBlank
    private String message;
    // Optional: If provided, the AI will have context about this lesson
    private Long lessonId;
    // Optional: If provided, the message will be associated with this session
    private Long sessionId;
}
