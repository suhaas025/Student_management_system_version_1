package com.example.try2.exception;

import org.springframework.http.HttpStatus;

/**
 * Custom exception class for application-specific exceptions
 */
public class AppException extends RuntimeException {
    
    private final HttpStatus status;
    private final String errorCode;
    
    public AppException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = "APP_ERROR";
    }
    
    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = "APP_ERROR";
    }
    
    public AppException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
    
    public AppException(String message, Throwable cause) {
        super(message, cause);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = "APP_ERROR";
    }
    
    public AppException(String message, Throwable cause, HttpStatus status) {
        super(message, cause);
        this.status = status;
        this.errorCode = "APP_ERROR";
    }
    
    public AppException(String message, Throwable cause, HttpStatus status, String errorCode) {
        super(message, cause);
        this.status = status;
        this.errorCode = errorCode;
    }
    
    public HttpStatus getStatus() {
        return status;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
} 