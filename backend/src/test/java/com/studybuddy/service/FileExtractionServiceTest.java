package com.studybuddy.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileExtractionServiceTest {

    private FileExtractionService fileExtractionService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        fileExtractionService = new FileExtractionService();
        ReflectionTestUtils.setField(fileExtractionService, "uploadDir", tempDir.toString());
    }

    @Test
    void testSaveFile_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "Test content".getBytes()
        );

        String savedPath = fileExtractionService.saveFile(file);

        assertNotNull(savedPath);
        assertTrue(Files.exists(Path.of(savedPath)));
        assertTrue(savedPath.contains("test.txt"));
    }

    @Test
    void testSaveFile_CreatesUploadDirectory() throws IOException {
        Path newDir = tempDir.resolve("new_uploads");
        ReflectionTestUtils.setField(fileExtractionService, "uploadDir", newDir.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "PDF content".getBytes()
        );

        String savedPath = fileExtractionService.saveFile(file);

        assertTrue(Files.exists(newDir));
        assertTrue(Files.exists(Path.of(savedPath)));
    }

    @Test
    void testSaveFile_WithEmptyFilename() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                null,
                "text/plain",
                "Content".getBytes()
        );

        String savedPath = fileExtractionService.saveFile(file);

        assertNotNull(savedPath);
        assertTrue(Files.exists(Path.of(savedPath)));
    }
}

