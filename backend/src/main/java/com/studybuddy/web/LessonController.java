package com.studybuddy.web;

import com.studybuddy.domain.Lesson;
import com.studybuddy.domain.StudySession;
import com.studybuddy.dto.LessonUploadRequest;
import com.studybuddy.dto.LessonWithProgressDTO;
import com.studybuddy.repository.LessonRepository;
import com.studybuddy.repository.StudySessionRepository;
import com.studybuddy.service.FileExtractionService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lessons")
@lombok.extern.slf4j.Slf4j
public class LessonController {

    private final LessonRepository lessonRepository;
    private final StudySessionRepository studySessionRepository;
    private final FileExtractionService fileExtractionService;

    public LessonController(LessonRepository lessonRepository,
                           StudySessionRepository studySessionRepository,
                           FileExtractionService fileExtractionService) {
        this.lessonRepository = lessonRepository;
        this.studySessionRepository = studySessionRepository;
        this.fileExtractionService = fileExtractionService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Lesson> upload(@Valid @RequestBody LessonUploadRequest req) {
        log.info("Uploading text lesson for userId={} title={}", req.getUserId(), req.getTitle());
        Lesson lesson = Lesson.builder()
                .userId(req.getUserId())
                .title(req.getTitle())
                .filePath(null)
                .extractedContent(req.getText())
                .build();
        Lesson saved = lessonRepository.save(lesson);
        log.info("Saved lesson id={} (text upload)", saved.getId());
        return ResponseEntity.ok(saved);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Lesson> uploadFile(@RequestParam Long userId,
                                             @RequestParam String title,
                                             @RequestParam("file") MultipartFile file) throws Exception {
        log.info("Uploading file lesson for userId={} title={} filename={}", userId, title, file.getOriginalFilename());
        String savedPath = fileExtractionService.saveFile(file);
        String extracted = fileExtractionService.extractText(file, Paths.get(savedPath));
        Lesson lesson = Lesson.builder()
                .userId(userId)
                .title(title)
                .filePath(savedPath)
                .extractedContent(extracted)
                .build();
        Lesson saved = lessonRepository.save(lesson);
        log.info("Saved lesson id={} (file upload) path={}", saved.getId(), savedPath);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<LessonWithProgressDTO>> list(@RequestParam Long userId) {
        List<Lesson> lessons = lessonRepository.findByUserIdOrderByUploadedAtDesc(userId);

        Map<Long, StudySession> sessionMap = studySessionRepository.findByUserId(userId)
                .stream()
                .collect(Collectors.toMap(StudySession::getLessonId, session -> session));

        List<LessonWithProgressDTO> lessonsWithProgress = lessons.stream()
                .map(lesson -> {
                    StudySession session = sessionMap.get(lesson.getId());
                    return LessonWithProgressDTO.builder()
                            .id(lesson.getId())
                            .userId(lesson.getUserId())
                            .title(lesson.getTitle())
                            .filePath(lesson.getFilePath())
                            .extractedContent(lesson.getExtractedContent())
                            .uploadedAt(lesson.getUploadedAt())
                            .progress(session != null ? (int) Math.round(session.getProgress()) : 0)
                            .lastReviewed(session != null ? session.getLastReviewed() : null)
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(lessonsWithProgress);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return lessonRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        log.info("Delete request for lesson id={}", id);
        return lessonRepository.findById(id)
                .map(lesson -> {
                    lessonRepository.delete(lesson);
                    log.info("Deleted lesson id={}", id);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    log.warn("Lesson id={} not found for deletion", id);
                    return ResponseEntity.notFound().build();
                });
    }
}
