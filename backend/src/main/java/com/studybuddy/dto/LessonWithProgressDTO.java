package com.studybuddy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonWithProgressDTO {
    private Long id;
    private Long userId;
    private String title;
    private String filePath;
    private String extractedContent;
    private LocalDateTime uploadedAt;
    private Integer progress; // 0-100 as integer
    private LocalDateTime lastReviewed; // When the user last worked on this lesson
}
