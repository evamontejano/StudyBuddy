package com.studybuddy.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AICard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long lessonId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AICardType type;

    @Column(columnDefinition = "TEXT")
    private String content; // JSON or text
}
