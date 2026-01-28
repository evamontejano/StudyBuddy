package com.studybuddy.repository;

import com.studybuddy.domain.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByLessonId(Long lessonId);
}
