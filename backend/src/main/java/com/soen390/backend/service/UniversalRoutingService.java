package com.soen390.backend.service;

import com.soen390.backend.enums.BuildingLocation;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.object.ShuttleSchedule;
import com.soen390.backend.object.UniversalDirectionResponse;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class UniversalRoutingService {

    private final IndoorDirectionService indoorDirectionService;
    private final GoogleMapsService googleMapsService;
    private final ShuttleScheduleService shuttleScheduleService;

    public UniversalRoutingService(IndoorDirectionService indoorDirectionService,
                                   GoogleMapsService googleMapsService,
                                   ShuttleScheduleService shuttleScheduleService) {
        this.indoorDirectionService = indoorDirectionService;
        this.googleMapsService = googleMapsService;
        this.shuttleScheduleService = shuttleScheduleService;
    }

    private String getBuildingEntranceId(String buildingId) {
        if (buildingId == null) return "main-entrance";


        if (buildingId.startsWith("H")) return "H1-Maisonneuve-Entry";
        if (buildingId.startsWith("CC")) return "CC-Entrance-Exit";
        if (buildingId.startsWith("LB")) return "LB2-Emergency-Exit-1";

        if (buildingId.startsWith("VE")) return "VE1-Entrance/exit";
        if (buildingId.startsWith("VL")) return "VL-101";
        if (buildingId.startsWith("MB")) return "MB1-Main-Entrance";

        return "main-entrance";
    }

    private String getBuildingEntranceFloor(String buildingId) {
        if (buildingId == null) return "1";

        if (buildingId.startsWith("LB")) return "2";

        return "1";
    }

    public UniversalDirectionResponse getCompleteRoute(
            String startBuilding, String startRoom, String startFloor,
            String endBuilding, String endRoom, String endFloor,
            boolean avoidStairs) {

        BuildingLocation originLoc = BuildingLocation.fromId(startBuilding);
        BuildingLocation destLoc = BuildingLocation.fromId(endBuilding);

        String startExitId = getBuildingEntranceId(startBuilding);
        String endEntranceId = getBuildingEntranceId(endBuilding);

        String startGroundFloor = getBuildingEntranceFloor(startBuilding);
        String endGroundFloor = getBuildingEntranceFloor(endBuilding);

        IndoorDirectionResponse leg1 = indoorDirectionService.getIndoorDirections(
                startBuilding, startRoom, startExitId, startFloor, startGroundFloor, avoidStairs);

        boolean sameCampus = originLoc.campus.equals(destLoc.campus);
        TransportMode mode = sameCampus ? TransportMode.WALKING : TransportMode.TRANSIT;

        OutdoorDirectionResponse leg2 = googleMapsService.getDirections(
                originLoc.address, destLoc.address, mode);

        String nextShuttle = null;
        if (!sameCampus) {
            nextShuttle = getNextShuttleTime(originLoc.campus);
        }

        IndoorDirectionResponse leg3 = indoorDirectionService.getIndoorDirections(
                endBuilding, endEntranceId, endRoom, endGroundFloor, endFloor, avoidStairs);

        String totalDuration = calculateTotalDuration(leg2.getDuration());

        return new UniversalDirectionResponse(leg1, leg2, leg3, nextShuttle, totalDuration);
    }

    private String getNextShuttleTime(String fromCampus) {
        LocalTime now = LocalTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

        List<ShuttleSchedule> schedules = shuttleScheduleService.getSchedules();
        for (ShuttleSchedule schedule : schedules) {
            if (schedule.getCampus().equalsIgnoreCase(fromCampus) && schedule.getDayType().equalsIgnoreCase("weekday")) {
                for (String timeStr : schedule.getDepartureTimes()) {
                    LocalTime shuttleTime = LocalTime.parse(timeStr, formatter);
                    if (shuttleTime.isAfter(now)) {
                        return timeStr;
                    }
                }
            }
        }
        return "No more shuttles today";
    }

    private String calculateTotalDuration(String dur2) {
        return "Approx " + dur2 + " + indoor walking time.";
    }
}
