package com.soen390.backend.controller;

import com.soen390.backend.exception.GoogleMapsDirectionEmptyException;
import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.service.GoogleMapsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/directions/outdoor")
public class OutdoorDirectionsController {

    private final GoogleMapsService mapsService;

    public OutdoorDirectionsController(GoogleMapsService mapsService) {
        this.mapsService = mapsService;
    }


    @GetMapping
    public ResponseEntity<Object> getDirections(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam TransportMode transportMode) {
        try {
            OutdoorDirectionResponse response =
                    mapsService.getDirections(origin, destination, transportMode);
            return ResponseEntity.ok(response);
        } catch (GoogleMapsDirectionEmptyException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (GoogleMapsDirectionsApiException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", e.getMessage()));
        }
    }
}
