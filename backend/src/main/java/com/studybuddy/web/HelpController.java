package com.studybuddy.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class HelpController {

    @GetMapping("/api/help")
    public Map<String, Object> help() {
        return Map.of(
                "service", "study-buddy",
                "version", "0.0.1",
                "notes", List.of(
                        "All endpoints are open in dev (no auth)",
                        "AI provenance header X-AI-Model is returned by chat and generation endpoints",
                        "QA flashcards are generated as MCQ JSON: [{question, options[3], correctIndex, questionIndex}]"
                ),
                "endpoints", List.of(
                        Map.of(
                                "method", "GET",
                                "path", "/api/health",
                                "description", "Basic health check"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/ai/info",
                                "description", "AI availability, configured model, base URL"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/auth/register",
                                "contentType", "application/json",
                                "bodyExample", Map.of("name", "Alice", "email", "alice@example.com", "password", "secret"),
                                "description", "Register a new user; returns a dev token and user info"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/auth/login",
                                "contentType", "application/json",
                                "bodyExample", Map.of("email", "alice@example.com", "password", "secret"),
                                "description", "Login user; returns a dev token and user info"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/auth/change-password",
                                "contentType", "application/json",
                                "bodyExample", Map.of("userId", 1, "currentPassword", "oldSecret", "newPassword", "newSecret", "confirmNewPassword", "newSecret"),
                                "description", "Change user password; requires current password and matching new password confirmation"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/auth/delete-account",
                                "contentType", "application/json",
                                "bodyExample", Map.of("userId", 1, "password", "secret"),
                                "description", "Delete user account; requires password verification. Permanently deletes user and all associated data (lessons, chat sessions)"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/chat",
                                "contentType", "application/json",
                                "bodyExample", Map.of("userId", 1, "message", "Hello!"),
                                "bodyExample2", Map.of("userId", 1, "message", "What is the biggest planet?", "lessonId", 25),
                                "bodyExample3", Map.of("userId", 1, "message", "Hello!", "sessionId", 5),
                                "description", "Chat with AI; response includes X-AI-Model header and sessionId. If sessionId is not provided, a new session is auto-created. Optional lessonId provides lesson context to the AI"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/chat/sessions",
                                "contentType", "application/json",
                                "bodyExample", Map.of("userId", 1, "title", "Study Session 1"),
                                "description", "Create a new chat session"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/chat/sessions",
                                "query", Map.of("userId", "1"),
                                "description", "Get all chat sessions for a user (most recent first)"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/chat/sessions/{sessionId}/history",
                                "description", "Get chat message history for a specific session"
                        ),
                        Map.of(
                                "method", "DELETE",
                                "path", "/api/chat/sessions/{sessionId}",
                                "description", "Delete a chat session and all its messages"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/lessons/upload",
                                "contentType", "application/json",
                                "bodyExample", Map.of("userId", 1, "title", "My Notes", "text", "Paste or type your lesson text here"),
                                "description", "Upload text directly without files"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/lessons/upload",
                                "contentType", "multipart/form-data",
                                "formFields", Map.of("userId", "1", "title", "My PDF", "file", "<attach a PDF/DOCX/PPTX/image>"),
                                "description", "Upload a file; server extracts text (Tika). OCR for scanned images is optional"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/lessons",
                                "query", Map.of("userId", "1"),
                                "description", "List lessons for a user (most recent first) with progress information"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/lessons/{id}",
                                "description", "Get lesson details including extractedContent"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/lessons/{id}/generate",
                                "description", "Generate Summary, Key Notes, and MCQ Flashcards; returns X-AI-Model header"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/lessons/{id}/cards",
                                "description", "Retrieve generated AI cards for a lesson"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/lessons/{id}/quiz/check",
                                "contentType", "application/json",
                                "bodyExample", Map.of("questionIndex", 0, "selectedIndex", 2),
                                "description", "Check if selected option is correct for the MCQ quiz"
                        ),
                        Map.of(
                                "method", "POST",
                                "path", "/api/study/{lessonId}/progress",
                                "contentType", "application/json",
                                "bodyExample", Map.of("userId", 1, "progress", 60),
                                "description", "Update study progress for a lesson (0..100)"
                        ),
                        Map.of(
                                "method", "GET",
                                "path", "/api/study/progress",
                                "query", Map.of("userId", "1"),
                                "description", "Get user progress summary: total lessons, mastered lessons, average mastery, and streak days"
                        )
                )
        );
    }
}
