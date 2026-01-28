package com.studybuddy.repository;

import com.studybuddy.domain.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByUserIdOrderByUploadedAtDesc(Long userId);
    void deleteByUserId(Long userId);
    Long countByUserId(Long userId);
}
