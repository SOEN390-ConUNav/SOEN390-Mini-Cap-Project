package com.soen390.backend.controller;

import com.soen390.backend.exception.GoogleMapsDirectionEmptyException;
import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.UniversalDirectionResponse;
import com.soen390.backend.service.UniversalRoutingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/directions/universal")
public class UniversalRoutingController {

    private static final String ERR_KEY = "error";
    private final UniversalRoutingService universalRoutingService;

    public UniversalRoutingController(UniversalRoutingService universalRoutingService) {
        this.universalRoutingService = universalRoutingService;
    }

    @GetMapping
    public ResponseEntity<Object> getUniversalRoute(
            @RequestParam String startBuilding,
            @RequestParam String startRoom,
            @RequestParam String startFloor,
            @RequestParam String endBuilding,
            @RequestParam String endRoom,
            @RequestParam String endFloor,
            @RequestParam(defaultValue = "false") boolean avoidStairs) {

        try {
            UniversalDirectionResponse response = universalRoutingService.getCompleteRoute(
                    startBuilding, startRoom, startFloor,
                    endBuilding, endRoom, endFloor, avoidStairs);
            return ResponseEntity.ok(response);
        } catch (GoogleMapsDirectionEmptyException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(ERR_KEY, e.getMessage()));
        } catch (GoogleMapsDirectionsApiException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(ERR_KEY, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    ERR_KEY, e.getMessage() != null ? e.getMessage() : "Universal routing failed"));
        }
    }
}