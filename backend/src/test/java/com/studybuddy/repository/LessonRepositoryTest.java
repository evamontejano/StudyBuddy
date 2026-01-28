package com.studybuddy.repository;

import com.studybuddy.domain.Lesson;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class LessonRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private LessonRepository lessonRepository;

    @Test
    void testFindByUserIdOrderByUploadedAtDesc() {
        // Arrange
        Lesson lesson1 = Lesson.builder()
                .userId(1L)
                .title("First Lesson")
                .extractedContent("Content 1")
                .build();
        Lesson lesson2 = Lesson.builder()
                .userId(1L)
                .title("Second Lesson")
                .extractedContent("Content 2")
                .build();
        Lesson lesson3 = Lesson.builder()
                .userId(2L)
                .title("Other User Lesson")
                .extractedContent("Content 3")
                .build();

        entityManager.persist(lesson1);
        entityManager.persist(lesson2);
        entityManager.persist(lesson3);
        entityManager.flush();

        // Act
        List<Lesson> userLessons = lessonRepository.findByUserIdOrderByUploadedAtDesc(1L);

        // Assert
        assertEquals(2, userLessons.size());
        assertTrue(userLessons.stream().allMatch(l -> l.getUserId().equals(1L)));
    }

    @Test
    void testCountByUserId() {
        // Arrange
        Lesson lesson1 = Lesson.builder()
                .userId(5L)
                .title("Lesson 1")
                .extractedContent("Content")
                .build();
        Lesson lesson2 = Lesson.builder()
                .userId(5L)
                .title("Lesson 2")
                .extractedContent("Content")
                .build();

        entityManager.persist(lesson1);
        entityManager.persist(lesson2);
        entityManager.flush();

        // Act
        Long count = lessonRepository.countByUserId(5L);

        // Assert
        assertEquals(2L, count);
    }

    @Test
    void testSaveLesson() {
        // Arrange
        Lesson lesson = Lesson.builder()
                .userId(10L)
                .title("New Lesson")
                .extractedContent("Test content")
                .build();

        // Act
        Lesson saved = lessonRepository.save(lesson);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("New Lesson", saved.getTitle());
        assertNotNull(saved.getUploadedAt());
    }
}

