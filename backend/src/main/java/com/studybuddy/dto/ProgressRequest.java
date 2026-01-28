package com.studybuddy.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressRequest {
    @NotNull
    private Long userId;
    @Min(0) @Max(100)
    private double progress;
}
