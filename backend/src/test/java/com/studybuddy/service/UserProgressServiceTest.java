package com.studybuddy.service;

import com.studybuddy.domain.StudySession;
import com.studybuddy.dto.UserProgressSummary;
import com.studybuddy.repository.ChatMessageRepository;
import com.studybuddy.repository.LessonRepository;
import com.studybuddy.repository.StudySessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProgressServiceTest {

    @Mock
    private StudySessionRepository studySessionRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private UserProgressService userProgressService;

    @Test
    void testGetUserProgressSummary_WithSessions() {
        // Arrange
        Long userId = 1L;
        StudySession session1 = StudySession.builder()
                .userId(userId)
                .lessonId(1L)
                .progress(100.0)
                .build();
        StudySession session2 = StudySession.builder()
                .userId(userId)
                .lessonId(2L)
                .progress(50.0)
                .build();

        when(studySessionRepository.findByUserId(userId))
                .thenReturn(Arrays.asList(session1, session2));
        when(lessonRepository.findByUserIdOrderByUploadedAtDesc(userId))
                .thenReturn(Arrays.asList());
        when(chatMessageRepository.findByUserIdOrderByTimestampAsc(userId))
                .thenReturn(Collections.emptyList());

        // Act
        UserProgressSummary summary = userProgressService.getUserProgressSummary(userId);

        // Assert
        assertNotNull(summary);
        assertEquals(1, summary.getMasteredLessons());
        verify(studySessionRepository).findByUserId(userId);
        verify(lessonRepository).findByUserIdOrderByUploadedAtDesc(userId);
    }

    @Test
    void testGetUserProgressSummary_NoSessions() {
        // Arrange
        Long userId = 2L;
        when(studySessionRepository.findByUserId(userId))
                .thenReturn(Collections.emptyList());
        when(lessonRepository.findByUserIdOrderByUploadedAtDesc(userId))
                .thenReturn(Collections.emptyList());
        when(chatMessageRepository.findByUserIdOrderByTimestampAsc(userId))
                .thenReturn(Collections.emptyList());

        // Act
        UserProgressSummary summary = userProgressService.getUserProgressSummary(userId);

        // Assert
        assertNotNull(summary);
        assertEquals(0, summary.getTotalLessons());
        assertEquals(0, summary.getMasteredLessons());
        assertEquals(0, summary.getAverageMastery());
    }
}

