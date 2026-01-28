package com.studybuddy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(excludeName = {
		"org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration",
		"org.springframework.ai.autoconfigure.openai.OpenAiChatAutoConfiguration",
		"org.springframework.ai.autoconfigure.openai.OpenAiImageAutoConfiguration",
		"org.springframework.ai.autoconfigure.openai.OpenAiAudioSpeechAutoConfiguration",
		"org.springframework.ai.autoconfigure.openai.OpenAiAudioTranscriptionAutoConfiguration",
		"org.springframework.ai.autoconfigure.openai.OpenAiEmbeddingAutoConfiguration",
		"org.springframework.ai.autoconfigure.openai.OpenAiModerationAutoConfiguration"
})
public class StudyBuddyApplication {

	public static void main(String[] args) {
		SpringApplication.run(StudyBuddyApplication.class, args);
	}

}
