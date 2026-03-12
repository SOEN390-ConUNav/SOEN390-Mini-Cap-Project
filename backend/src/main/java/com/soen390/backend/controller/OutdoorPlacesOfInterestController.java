package com.soen390.backend.controller;

import com.soen390.backend.enums.PlaceType;
import com.soen390.backend.service.PlacesOfInterestService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class OutdoorPlacesOfInterestController {

    private final PlacesOfInterestService placesOfInterestService;

    public OutdoorPlacesOfInterestController(PlacesOfInterestService placesOfInterestService) {
        this.placesOfInterestService = placesOfInterestService;
    }

    @PostMapping("/api/places/outdoor")
    public ResponseEntity<String> getPlaces(
            @RequestParam(defaultValue = "20", required = false) int maxResultCount,
            @RequestParam(defaultValue = "500", required = false) double radius,
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam String placeType
    ) {
        PlaceType normalizedPlaceType;
        try {
            normalizedPlaceType = PlaceType.fromQueryParam(placeType);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid placeType: " + placeType, ex);
        }

        String rawJson = placesOfInterestService.getNearbyPlaces(
                maxResultCount,
                radius,
                latitude,
                longitude,
                normalizedPlaceType
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(rawJson);
    }

}
