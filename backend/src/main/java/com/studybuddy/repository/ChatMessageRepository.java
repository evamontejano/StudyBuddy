package com.studybuddy.repository;

import com.studybuddy.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserIdOrderByTimestampAsc(Long userId);
    List<ChatMessage> findBySessionIdOrderByTimestampAsc(Long sessionId);
    void deleteBySessionId(Long sessionId);
}
