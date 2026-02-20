package com.soen390.backend.exception;

public class GoogleMapsDirectionEmptyException extends RuntimeException {
    public GoogleMapsDirectionEmptyException(String message) {
        super(message);
    }
}
