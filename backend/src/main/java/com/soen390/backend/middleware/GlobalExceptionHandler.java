package com.soen390.backend.middleware;

import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.exception.IndoorResourceNotFoundException;
import com.soen390.backend.exception.InvalidIndoorRequestException;
import com.soen390.backend.object.DefaultErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GoogleMapsDirectionsApiException.class)
    public ResponseEntity<DefaultErrorResponse> handleMapsError(
            GoogleMapsDirectionsApiException ex,
            HttpServletRequest request) {

        DefaultErrorResponse body = new DefaultErrorResponse(
                DefaultErrorResponse.now(),
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidIndoorRequestException.class)
    public ResponseEntity<DefaultErrorResponse> handleInvalidIndoorRequest(
            InvalidIndoorRequestException ex,
            HttpServletRequest request) {

        DefaultErrorResponse body = new DefaultErrorResponse(
                DefaultErrorResponse.now(),
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IndoorResourceNotFoundException.class)
    public ResponseEntity<DefaultErrorResponse> handleIndoorResourceNotFound(
            IndoorResourceNotFoundException ex,
            HttpServletRequest request) {

        DefaultErrorResponse body = new DefaultErrorResponse(
                DefaultErrorResponse.now(),
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

}

