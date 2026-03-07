package com.soen390.backend.controller;

import com.soen390.backend.object.UniversalDirectionResponse;
import com.soen390.backend.service.UniversalRoutingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/directions/universal")
public class UniversalRoutingController {

    private final UniversalRoutingService universalRoutingService;

    public UniversalRoutingController(UniversalRoutingService universalRoutingService) {
        this.universalRoutingService = universalRoutingService;
    }

    @GetMapping
    public ResponseEntity<UniversalDirectionResponse> getUniversalRoute(
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
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}