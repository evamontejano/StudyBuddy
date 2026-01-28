package com.studybuddy.web;

import com.studybuddy.domain.StudySession;
import com.studybuddy.dto.ProgressRequest;
import com.studybuddy.dto.UserProgressSummary;
import com.studybuddy.repository.StudySessionRepository;
import com.studybuddy.service.UserProgressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/study")
@lombok.extern.slf4j.Slf4j
public class StudyController {

    private final StudySessionRepository repo;
    private final UserProgressService progressService;

    public StudyController(StudySessionRepository repo, UserProgressService progressService) {
        this.repo = repo;
        this.progressService = progressService;
    }

    @PostMapping("/{lessonId}/progress")
    public ResponseEntity<StudySession> updateProgress(@PathVariable Long lessonId,
                                                       @Valid @RequestBody ProgressRequest req) {
        log.info("Updating progress for userId={} lessonId={} progress={}", req.getUserId(), lessonId, req.getProgress());
        var session = repo.findByUserIdAndLessonId(req.getUserId(), lessonId).orElse(
                StudySession.builder().userId(req.getUserId()).lessonId(lessonId).build()
        );
        session.setProgress(req.getProgress());
        session.setLastReviewed(LocalDateTime.now());
        StudySession saved = repo.save(session);
        log.info("Saved study session id={} progress={}", saved.getId(), saved.getProgress());
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/progress")
    public ResponseEntity<UserProgressSummary> getUserProgress(@RequestParam Long userId) {
        log.info("Fetching progress summary for userId={}", userId);
        UserProgressSummary summary = progressService.getUserProgressSummary(userId);
        return ResponseEntity.ok(summary);
    }
}
