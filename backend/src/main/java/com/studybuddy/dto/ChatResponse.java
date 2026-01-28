package com.studybuddy.dto;

import lombok.Data;

@Data
public class ChatResponse {
    private String reply;
    private Long sessionId; // The session ID used (auto-created or provided)
}
