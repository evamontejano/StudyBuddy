package com.studybuddy.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long lessonId;

    private double progress; // % mastered

    private LocalDateTime lastReviewed;

    @PrePersist
    public void prePersist() {
        if (lastReviewed == null) lastReviewed = LocalDateTime.now();
    }
}
