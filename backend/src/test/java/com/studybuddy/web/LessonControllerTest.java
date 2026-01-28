package com.studybuddy.web;

import com.studybuddy.domain.Lesson;
import com.studybuddy.dto.LessonUploadRequest;
import com.studybuddy.repository.LessonRepository;
import com.studybuddy.repository.StudySessionRepository;
import com.studybuddy.service.FileExtractionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonControllerTest {

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private StudySessionRepository studySessionRepository;

    @Mock
    private FileExtractionService fileExtractionService;

    @InjectMocks
    private LessonController lessonController;

    @Test
    void testUpload_TextLesson_Success() {
        LessonUploadRequest request = new LessonUploadRequest();
        request.setUserId(1L);
        request.setTitle("Java Basics");
        request.setText("Variables, loops, and conditions");

        Lesson savedLesson = Lesson.builder()
                .id(1L)
                .userId(1L)
                .title("Java Basics")
                .extractedContent("Variables, loops, and conditions")
                .build();

        when(lessonRepository.save(any(Lesson.class))).thenReturn(savedLesson);

        ResponseEntity<Lesson> response = lessonController.upload(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Java Basics", response.getBody().getTitle());
        verify(lessonRepository).save(any(Lesson.class));
    }

    @Test
    void testGet_LessonFound() {
        Long lessonId = 1L;
        Lesson lesson = Lesson.builder()
                .id(lessonId)
                .userId(1L)
                .title("Test Lesson")
                .build();

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));

        ResponseEntity<?> response = lessonController.get(lessonId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(lessonRepository).findById(lessonId);
    }

    @Test
    void testGet_LessonNotFound() {
        Long lessonId = 999L;
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = lessonController.get(lessonId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(lessonRepository).findById(lessonId);
    }

    @Test
    void testDelete_LessonFound() {
        Long lessonId = 1L;
        Lesson lesson = Lesson.builder()
                .id(lessonId)
                .userId(1L)
                .title("To Delete")
                .build();

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        doNothing().when(lessonRepository).delete(lesson);

        ResponseEntity<?> response = lessonController.delete(lessonId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(lessonRepository).findById(lessonId);
        verify(lessonRepository).delete(lesson);
    }

    @Test
    void testDelete_LessonNotFound() {
        Long lessonId = 999L;
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = lessonController.delete(lessonId);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(lessonRepository).findById(lessonId);
        verify(lessonRepository, never()).delete(any(Lesson.class));
    }
}

