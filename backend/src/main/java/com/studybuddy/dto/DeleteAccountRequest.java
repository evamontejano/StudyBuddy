package com.studybuddy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeleteAccountRequest {
    @NotNull
    private Long userId;

    @NotBlank
    private String password;
}

