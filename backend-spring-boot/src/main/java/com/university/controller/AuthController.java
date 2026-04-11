package com.university.controller;

import com.university.model.dto.LoginRequest;
import com.university.model.dto.RegisterRequest;
import com.university.model.dto.SelfRegisterRequest;
import com.university.model.dto.SetPasswordRequest;
import com.university.model.dto.ResponseWrapper;
import com.university.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ResponseWrapper<Object>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            var result = authService.register(request.getEmail());
            return ResponseEntity.ok(ResponseWrapper.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<ResponseWrapper<Object>> verify(@RequestParam String token) {
        try {
            var result = authService.verifyToken(token);
            return ResponseEntity.ok(ResponseWrapper.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PostMapping("/set-password")
    public ResponseEntity<ResponseWrapper<Object>> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        try {
            var result = authService.setPassword(request.getToken(), request.getPassword());
            return ResponseEntity.ok(ResponseWrapper.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PostMapping("/self-register")
    public ResponseEntity<ResponseWrapper<Object>> selfRegister(@Valid @RequestBody SelfRegisterRequest request) {
        try {
            var result = authService.selfRegister(request.getName(), request.getEmail(), request.getPassword());
            return ResponseEntity.ok(ResponseWrapper.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ResponseWrapper<Object>> login(@Valid @RequestBody LoginRequest request) {
        try {
            var result = authService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(ResponseWrapper.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ResponseWrapper.error(e.getMessage(), e.getMessage()));
        }
    }
}
