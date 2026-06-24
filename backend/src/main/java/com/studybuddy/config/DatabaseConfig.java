package com.studybuddy.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

import javax.sql.DataSource;

@Configuration
@Slf4j
public class DatabaseConfig {

    private static final String DEFAULT_LOCAL_URL = "jdbc:postgresql://localhost:5432/studybuddy";
    private static final String DEFAULT_LOCAL_USERNAME = "postgres";
    private static final String DEFAULT_REGION = "eu-central-1";

    @Bean
    public DataSource dataSource(Environment env) {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setJdbcUrl(resolveValue(env, "DB_URL", "spring.datasource.url", DEFAULT_LOCAL_URL));
        dataSource.setUsername(resolveValue(env, "DB_USERNAME", "spring.datasource.username", DEFAULT_LOCAL_USERNAME));
        dataSource.setPassword(resolveDatabasePassword(env));
        return dataSource;
    }

    private String resolveDatabasePassword(Environment env) {
        String secretArn = firstNonBlank(
                env.getProperty("DB_PASSWORD_SECRET_ARN"),
                env.getProperty("DB_PASSWORD")
        );

        if (!StringUtils.hasText(secretArn)) {
            String fallback = env.getProperty("spring.datasource.password");
            if (StringUtils.hasText(fallback)) {
                return fallback;
            }
            throw new IllegalStateException("No database password or Secrets Manager reference found.");
        }

        if (looksLikeSecretReference(secretArn)) {
            String secretValue = fetchSecretValue(stripSecretReference(secretArn), env);
            log.info("Resolved database password from AWS Secrets Manager.");
            return secretValue;
        }

        if (looksLikeArn(secretArn)) {
            String secretValue = fetchSecretValue(secretArn, env);
            log.info("Resolved database password from AWS Secrets Manager ARN.");
            return secretValue;
        }

        return secretArn;
    }

    private String fetchSecretValue(String secretId, Environment env) {
        String regionName = firstNonBlank(
                env.getProperty("AWS_REGION"),
                env.getProperty("AWS_DEFAULT_REGION"),
                DEFAULT_REGION
        );

        try (SecretsManagerClient client = SecretsManagerClient.builder()
                .region(Region.of(regionName))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build()) {

            GetSecretValueResponse response = client.getSecretValue(
                    GetSecretValueRequest.builder()
                            .secretId(secretId)
                            .build()
            );

            if (!StringUtils.hasText(response.secretString())) {
                throw new IllegalStateException("Secrets Manager secret did not contain a SecretString.");
            }

            String secretValue = response.secretString().trim();
            log.info("Loaded database password from Secrets Manager (length={}).", secretValue.length());
            return secretValue;
        }
    }

    private String resolveValue(Environment env, String envKey, String propertyKey, String defaultValue) {
        return firstNonBlank(env.getProperty(envKey), env.getProperty(propertyKey), defaultValue);
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }

        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }

        return null;
    }

    private boolean looksLikeArn(String value) {
        return StringUtils.hasText(value) && value.trim().startsWith("arn:aws:secretsmanager:");
    }

    private boolean looksLikeSecretReference(String value) {
        return StringUtils.hasText(value) && value.trim().startsWith("{{resolve:secretsmanager:");
    }

    private String stripSecretReference(String value) {
        String trimmed = value.trim();
        if (!looksLikeSecretReference(trimmed)) {
            return trimmed;
        }

        String inner = trimmed.substring("{{resolve:secretsmanager:".length(), trimmed.length() - 2);
        int secretStringIndex = inner.indexOf(":SecretString");
        if (secretStringIndex >= 0) {
            return inner.substring(0, secretStringIndex);
        }

        int jsonKeyIndex = inner.indexOf(':');
        if (jsonKeyIndex > 0) {
            return inner.substring(0, jsonKeyIndex);
        }

        return inner;
    }
}
