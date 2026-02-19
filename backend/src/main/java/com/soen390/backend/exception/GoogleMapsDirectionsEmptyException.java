package com.soen390.backend.exception;

public class GoogleMapsDirectionsEmptyException extends RuntimeException {
    public GoogleMapsDirectionsEmptyException(String message) {
        super(message);
    }
}
