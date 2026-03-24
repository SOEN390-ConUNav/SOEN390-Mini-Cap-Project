package com.soen390.backend.exception;

public class GoogleMapsDirectionsApiException extends RuntimeException{
    public GoogleMapsDirectionsApiException(String message) {
        super(message);
    }

    public GoogleMapsDirectionsApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
