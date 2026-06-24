package com.studybuddy.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.Message;

/**
 * Calls Amazon Bedrock (Titan Text Express) as the AI backend.
 * Uses the EC2 instance profile credentials automatically — no access keys needed.
 */
@Service
@Slf4j
public class BedrockService {

    private final BedrockRuntimeClient client;
    private final String modelId;
    private final boolean enabled;

    public BedrockService(
            @Value("${app.bedrock.region:us-east-1}") String region,
            @Value("${app.bedrock.model-id:amazon.titan-text-express-v1}") String modelId,
            @Value("${app.bedrock.enabled:false}") boolean enabled) {
        this.modelId = modelId;
        this.enabled = enabled;
        if (enabled) {
            this.client = BedrockRuntimeClient.builder()
                    .region(Region.of(region))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            log.info("BedrockService initialized: region={}, model={}", region, modelId);
        } else {
            this.client = null;
            log.info("BedrockService is disabled (app.bedrock.enabled=false)");
        }
    }

    public boolean isEnabled() {
        return enabled && client != null;
    }

    /**
     * Send a plain-text prompt to Bedrock using the Converse API (works with all current models).
     */
    public String call(String prompt) {
        if (!isEnabled()) {
            throw new IllegalStateException("Bedrock service is not enabled");
        }
        try {
            ConverseRequest request = ConverseRequest.builder()
                    .modelId(modelId)
                    .messages(Message.builder()
                            .role(ConversationRole.USER)
                            .content(ContentBlock.fromText(prompt))
                            .build())
                    .build();

            ConverseResponse response = client.converse(request);
            String output = response.output().message().content().get(0).text();
            log.info("Bedrock call succeeded, output length={}", output != null ? output.length() : 0);
            return output;
        } catch (Exception e) {
            log.error("Bedrock call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Bedrock AI service error: " + e.getMessage(), e);
        }
    }
}
