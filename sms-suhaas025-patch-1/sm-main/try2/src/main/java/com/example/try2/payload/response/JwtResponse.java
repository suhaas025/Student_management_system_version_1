package com.example.try2.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String avatar;
    private List<String> roles;

    public JwtResponse(String token, Long id, String username, String email, String avatar, List<String> roles) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.avatar = avatar;
        this.roles = roles;
    }
} 