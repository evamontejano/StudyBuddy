package com.studybuddy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LessonUploadRequest {
    @NotNull
    private Long userId;
    @NotBlank
    private String title;
    // For Phase 1 we accept raw text; file upload to be added later
    private String text;
}
