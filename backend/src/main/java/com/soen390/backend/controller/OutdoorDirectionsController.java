package com.soen390.backend.controller;

import com.soen390.backend.enums.Campus;
import com.soen390.backend.exception.GoogleMapsDirectionEmptyException;
import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.service.GoogleMapsService;
import com.soen390.backend.service.ShuttleOutdoorDirectionsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/directions/outdoor")
public class OutdoorDirectionsController {

    private final GoogleMapsService mapsService;

    @Autowired
    private ShuttleOutdoorDirectionsService shuttleOutdoorDirectionsService;

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

    @GetMapping("/shuttle")
    public ResponseEntity<Object> getDirectionsWithShuttle(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam Campus destinationShuttle) {
        try {
            OutdoorDirectionResponse response = shuttleOutdoorDirectionsService.getShuttleOutdoorDirections(origin, destination, destinationShuttle);
            return ResponseEntity.ok(response);
        } catch (GoogleMapsDirectionEmptyException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (GoogleMapsDirectionsApiException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", e.getMessage()));
        }
    }
}
