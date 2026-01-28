package com.studybuddy.repository;

import com.studybuddy.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testFindByEmail_Found() {
        // Arrange
        User user = User.builder()
                .name("John Doe")
                .email("john@example.com")
                .passwordHash("hashedpassword")
                .build();
        entityManager.persist(user);
        entityManager.flush();

        // Act
        Optional<User> found = userRepository.findByEmail("john@example.com");

        // Assert
        assertTrue(found.isPresent());
        assertEquals("John Doe", found.get().getName());
        assertEquals("john@example.com", found.get().getEmail());
    }

    @Test
    void testFindByEmail_NotFound() {
        // Act
        Optional<User> found = userRepository.findByEmail("nonexistent@example.com");

        // Assert
        assertFalse(found.isPresent());
    }

    @Test
    void testSaveUser_Success() {
        // Arrange
        User user = User.builder()
                .name("Jane Smith")
                .email("jane@example.com")
                .passwordHash("hashed123")
                .build();

        // Act
        User saved = userRepository.save(user);

        // Assert
        assertNotNull(saved.getId());
        assertEquals("Jane Smith", saved.getName());
        assertNotNull(saved.getCreatedAt());
    }
}

