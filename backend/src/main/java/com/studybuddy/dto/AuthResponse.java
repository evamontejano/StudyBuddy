package com.studybuddy.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
}
