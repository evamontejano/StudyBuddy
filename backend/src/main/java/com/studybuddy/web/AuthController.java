package com.studybuddy.web;

import com.studybuddy.domain.User;
import com.studybuddy.dto.RegisterRequest;
import com.studybuddy.dto.AuthResponse;
import com.studybuddy.dto.LoginRequest;
import com.studybuddy.dto.ChangePasswordRequest;
import com.studybuddy.dto.DeleteAccountRequest;
import com.studybuddy.repository.UserRepository;
import com.studybuddy.repository.LessonRepository;
import com.studybuddy.repository.ChatSessionRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@lombok.extern.slf4j.Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LessonRepository lessonRepository;
    private final ChatSessionRepository chatSessionRepository;

    public AuthController(UserRepository userRepository,
                         PasswordEncoder passwordEncoder,
                         LessonRepository lessonRepository,
                         ChatSessionRepository chatSessionRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.lessonRepository = lessonRepository;
        this.chatSessionRepository = chatSessionRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        log.info("Register attempt for email={}", req.getEmail());
        var existing = userRepository.findByEmail(req.getEmail());
        if (existing.isPresent()) {
            log.warn("Registration failed: email already registered email={}", req.getEmail());
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .build();
        user = userRepository.save(user);
        log.info("User registered id={} email={}", user.getId(), user.getEmail());

        AuthResponse resp = new AuthResponse();
        resp.setToken("dev-dummy-token");
        resp.setUserId(user.getId());
        resp.setName(user.getName());
        resp.setEmail(user.getEmail());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        log.info("Login attempt for email={}", req.getEmail());
        var user = userRepository.findByEmail(req.getEmail())
                .orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed for email={}", req.getEmail());
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        log.info("Login success for userId={} email={}", user.getId(), user.getEmail());
        AuthResponse resp = new AuthResponse();
        resp.setToken("dev-dummy-token");
        resp.setUserId(user.getId());
        resp.setName(user.getName());
        resp.setEmail(user.getEmail());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        log.info("Change password attempt for userId={}", req.getUserId());

        if (!req.getNewPassword().equals(req.getConfirmNewPassword())) {
            log.warn("Password change failed: new passwords do not match userId={}", req.getUserId());
            return ResponseEntity.badRequest().body(Map.of("error", "New passwords do not match"));
        }

        var user = userRepository.findById(req.getUserId())
                .orElse(null);
        if (user == null) {
            log.warn("Password change failed: user not found userId={}", req.getUserId());
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            log.warn("Password change failed: incorrect current password userId={}", req.getUserId());
            return ResponseEntity.status(401).body(Map.of("error", "Current password is incorrect"));
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for userId={}", user.getId());

        return ResponseEntity.ok(Map.of(
            "message", "Password changed successfully",
            "userId", user.getId()
        ));
    }

    @PostMapping("/delete-account")
    @Transactional
    public ResponseEntity<?> deleteAccount(@Valid @RequestBody DeleteAccountRequest req) {
        log.info("Delete account attempt for userId={}", req.getUserId());

        var user = userRepository.findById(req.getUserId())
                .orElse(null);
        if (user == null) {
            log.warn("Account deletion failed: user not found userId={}", req.getUserId());
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            log.warn("Account deletion failed: incorrect password userId={}", req.getUserId());
            return ResponseEntity.status(401).body(Map.of("error", "Password is incorrect"));
        }

        log.info("Deleting all lessons for userId={}", req.getUserId());
        lessonRepository.deleteByUserId(req.getUserId());

        log.info("Deleting all chat sessions for userId={}", req.getUserId());
        chatSessionRepository.deleteByUserId(req.getUserId());

        userRepository.delete(user);
        log.info("User account deleted successfully userId={} email={}", req.getUserId(), user.getEmail());

        return ResponseEntity.ok(Map.of(
            "message", "Account deleted successfully",
            "email", user.getEmail()
        ));
    }
}
