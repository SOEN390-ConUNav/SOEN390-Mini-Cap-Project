package com.soen390.backend.controller;

import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.service.IndoorDirectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/directions/indoor")
public class IndoorDirectionsController {

    @Autowired
    private IndoorDirectionService indoorDirectionService;

    @GetMapping
    public IndoorDirectionResponse getIndoorDirections(
            @RequestParam String buildingId,
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String originFloor,
            @RequestParam(required = false) String destinationFloor) {

        return indoorDirectionService.getIndoorDirections(
                buildingId,
                origin,
                destination,
                originFloor,
                destinationFloor
        );
    }
    
    @GetMapping("/rooms")
    public List<String> getAvailableRooms(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {
        
        return indoorDirectionService.getAvailableRooms(buildingId, floor);
    }
    
    @GetMapping("/waypoints")
    public List<WaypointResponse> getWaypoints(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {
        
        return indoorDirectionService.getWaypoints(buildingId, floor);
    }
    
    @GetMapping("/room-points")
    public List<RoomPointResponse> getRoomPoints(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {
        
        return indoorDirectionService.getRoomPoints(buildingId, floor);
    }

    @GetMapping("/pois")
    public List<PoiResponse> getPointsOfInterest(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {
        
        return indoorDirectionService.getPointsOfInterest(buildingId, floor);
    }
    
    public static class PoiResponse {
        public double x;
        public double y;
        public String id;    // this id is to be able to differentiate between the different same name POIs     
        public String displayName; 
        public String type;       
        
        public PoiResponse(double x, double y, String id, String displayName, String type) {
            this.x = x;
            this.y = y;
            this.id = id;
            this.displayName = displayName;
            this.type = type;
        }
    }

    public static class WaypointResponse {
        public double x;
        public double y;
        public String id;
        
        public WaypointResponse(double x, double y, String id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
    }
    
    public static class RoomPointResponse {
        public double x;
        public double y;
        public String id;
        
        public RoomPointResponse(double x, double y, String id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
    }
}
