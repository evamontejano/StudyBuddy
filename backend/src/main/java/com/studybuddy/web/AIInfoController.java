package com.studybuddy.web;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
@lombok.extern.slf4j.Slf4j
public class AIInfoController {

    private final Optional<ChatModel> chatModel;
    private final Environment env;

    public AIInfoController(Optional<ChatModel> chatModel, Environment env) {
        this.chatModel = chatModel;
        this.env = env;
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        boolean available = chatModel.isPresent();
        String model = env.getProperty("spring.ai.ollama.chat.options.model", "unknown");
        String baseUrl = env.getProperty("spring.ai.ollama.base-url", "unknown");
        log.info("AI info requested: available={} model={} baseUrl={}", available, model, baseUrl);
        return Map.of(
                "available", available,
                "provider", "ollama",
                "modelConfigured", model,
                "baseUrl", baseUrl
        );
    }
}
