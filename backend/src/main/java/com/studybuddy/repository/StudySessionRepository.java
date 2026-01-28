package com.studybuddy.repository;

import com.studybuddy.domain.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    Optional<StudySession> findByUserIdAndLessonId(Long userId, Long lessonId);
    List<StudySession> findByUserId(Long userId);
}
