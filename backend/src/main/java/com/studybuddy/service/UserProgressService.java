package com.studybuddy.service;

import com.studybuddy.domain.ChatMessage;
import com.studybuddy.domain.Lesson;
import com.studybuddy.domain.StudySession;
import com.studybuddy.dto.UserProgressSummary;
import com.studybuddy.repository.ChatMessageRepository;
import com.studybuddy.repository.LessonRepository;
import com.studybuddy.repository.StudySessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class UserProgressService {

    private final LessonRepository lessonRepository;
    private final StudySessionRepository studySessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    public UserProgressService(LessonRepository lessonRepository,
                              StudySessionRepository studySessionRepository,
                              ChatMessageRepository chatMessageRepository) {
        this.lessonRepository = lessonRepository;
        this.studySessionRepository = studySessionRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    public UserProgressSummary getUserProgressSummary(Long userId) {
        // Get all lessons for the user
        List<Lesson> lessons = lessonRepository.findByUserIdOrderByUploadedAtDesc(userId);
        int totalLessons = lessons.size();

        // Get all study sessions for the user
        List<StudySession> sessions = studySessionRepository.findByUserId(userId);
        List<ChatMessage> messages = chatMessageRepository.findByUserIdOrderByTimestampAsc(userId);

        // Calculate mastered lessons (100% progress)
        int masteredLessons = (int) sessions.stream()
                .filter(s -> s.getProgress() >= 100.0)
                .count();

        // Calculate average mastery as integer
        int averageMastery = 0;
        if (totalLessons > 0) {
            double totalProgress = sessions.stream()
                    .mapToDouble(StudySession::getProgress)
                    .sum();
            averageMastery = (int) Math.round(totalProgress / totalLessons);
        }

        // Calculate streak days
        int streakDays = calculateStreakDays(lessons, sessions, messages);

        return UserProgressSummary.builder()
                .userId(userId)
                .totalLessons(totalLessons)
                .masteredLessons(masteredLessons)
                .averageMastery(averageMastery)
                .streakDays(streakDays)
                .build();
    }

    private int calculateStreakDays(List<Lesson> lessons, List<StudySession> sessions, List<ChatMessage> messages) {
        Set<LocalDate> activeDates = new HashSet<>();

        lessons.forEach(lesson -> {
            if (lesson.getUploadedAt() != null) {
                activeDates.add(lesson.getUploadedAt().toLocalDate());
            }
        });

        sessions.forEach(session -> {
            if (session.getLastReviewed() != null) {
                activeDates.add(session.getLastReviewed().toLocalDate());
            }
        });

        messages.forEach(message -> {
            if (message.getTimestamp() != null) {
                activeDates.add(message.getTimestamp().toLocalDate());
            }
        });

        LocalDate today = LocalDate.now();
        int streak = 0;

        if (!activeDates.contains(today) && !activeDates.contains(today.minusDays(1))) {
            return 0;
        }

        LocalDate checkDate = today;
        while (activeDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        if (!activeDates.contains(today) && activeDates.contains(today.minusDays(1))) {
            checkDate = today.minusDays(1);
            streak = 0;
            while (activeDates.contains(checkDate)) {
                streak++;
                checkDate = checkDate.minusDays(1);
            }
        }

        log.info("Calculated streak: {} days", streak);
        return streak;
    }
}
