package com.soen390.backend.controller;

import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.service.GoogleMapsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/directions/outdoor")
public class OutdoorDirectionsController {

    private final GoogleMapsService mapsService;

    public OutdoorDirectionsController(GoogleMapsService mapsService) {
        this.mapsService = mapsService;
    }


    @GetMapping
    public ResponseEntity<?> getDirections(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam TransportMode transportMode) {
        try {
            OutdoorDirectionResponse response =
                    mapsService.getDirections(origin, destination, transportMode);
            return ResponseEntity.ok(response);
        } catch (GoogleMapsDirectionsApiException e) {
            if (e.getMessage().contains("Directions not found")) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.status(502).body(e.getMessage());
        }
    }
}
