package com.studybuddy.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizCheckRequest {
    @NotNull
    @Min(0)
    private Integer questionIndex; // index within the generated quiz array

    @NotNull
    @Min(0)
    private Integer selectedIndex; // 0..2
}
