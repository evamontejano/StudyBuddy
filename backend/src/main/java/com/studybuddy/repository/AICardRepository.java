package com.studybuddy.repository;

import com.studybuddy.domain.AICard;
import com.studybuddy.domain.AICardType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AICardRepository extends JpaRepository<AICard, Long> {
    List<AICard> findByLessonIdOrderByIdAsc(Long lessonId);
    List<AICard> findByLessonIdAndType(Long lessonId, AICardType type);
}
