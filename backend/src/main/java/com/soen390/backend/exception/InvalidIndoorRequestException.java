package com.soen390.backend.exception;

public class InvalidIndoorRequestException extends RuntimeException {
    public InvalidIndoorRequestException(String message) {
        super(message);
    }
}
