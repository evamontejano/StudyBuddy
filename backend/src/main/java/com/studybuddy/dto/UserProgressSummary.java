package com.studybuddy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProgressSummary {
    private Long userId;
    private int totalLessons;
    private int masteredLessons; // Lessons with 100% progress
    private int averageMastery; // Average progress across all lessons (0-100)
    private int streakDays; // Consecutive days the user has been active
}

