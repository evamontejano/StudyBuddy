package com.studybuddy.dto;

import lombok.Data;

@Data
public class QuizCheckResponse {
    private boolean correct;
    private int correctIndex; // 0..2
}
