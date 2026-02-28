package com.soen390.backend.service;

import com.soen390.backend.enums.*;
import com.soen390.backend.object.*;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ShuttleOutdoorDirectionsService {
    String minutes = " mins";
    private final GoogleMapsService googleMapsService;

    ShuttleOutdoorDirectionsService(GoogleMapsService googleMapsService) {
        this.googleMapsService = googleMapsService;
    }

    public OutdoorDirectionResponse getShuttleOutdoorDirections(String origin, String destination, Campus destination_campus) {
        String loyolaCoords = String.format("%f,%f", CampusConstants.LOYOLA.getLatitude(), CampusConstants.LOYOLA.getLongitude());
        String sgwCoords = String.format("%f,%f", CampusConstants.SGW.getLatitude(), CampusConstants.SGW.getLongitude());

        String destShuttleCoords = (destination_campus == Campus.LOYOLA) ? loyolaCoords : sgwCoords;
        String originShuttleCoords = (destination_campus == Campus.LOYOLA) ? sgwCoords : loyolaCoords;

        OutdoorDirectionResponse walkToBus = googleMapsService.getDirections(origin, originShuttleCoords, TransportMode.walking);
        OutdoorDirectionResponse shuttleLeg = googleMapsService.getDirections(originShuttleCoords, destShuttleCoords, TransportMode.transit);
        OutdoorDirectionResponse walkToDest = googleMapsService.getDirections(destShuttleCoords, destination, TransportMode.walking);


        int walkMins = (int) extractDouble(walkToBus.getDuration());
        LocalTime arrivalAtStop = LocalTime.now(java.time.ZoneId.of("America/Montreal")).plusMinutes(walkMins);

        String departureLocation = (destination_campus == Campus.LOYOLA) ? "SGW" : "LOY";
        String nextDeparture = findNextDeparture(arrivalAtStop, departureLocation);

        int waitTime = 0;
        String shuttleInstruction = "Take the Concordia Shuttle Bus";

        if (nextDeparture != null) {
            LocalTime departureTime = LocalTime.parse(nextDeparture);
            waitTime = (int) java.time.Duration.between(arrivalAtStop, departureTime).toMinutes();
            shuttleInstruction += " (Scheduled at " + nextDeparture + ")";
        } else {

            return null;
        }


        RouteStep manualShuttleStep = new RouteStep(
                shuttleInstruction,
                shuttleLeg.getDistance(),
                shuttleLeg.getDuration(),
                ManeuverType.SHUTTLE,
                shuttleLeg.getPolyline()
        );


        List<RouteStep> allSteps = new ArrayList<>();
        allSteps.addAll(walkToBus.getSteps());
        if (waitTime > 0) {
            allSteps.add(new RouteStep("Wait for shuttle", "0 km", waitTime + minutes, ManeuverType.STRAIGHT, ""));
        }
        allSteps.add(manualShuttleStep);
        allSteps.addAll(walkToDest.getSteps());


        String totalDistance = sumMetricStrings(walkToBus.getDistance(), shuttleLeg.getDistance(), walkToDest.getDistance(), "km");

        double totalMins = extractDouble(walkToBus.getDuration()) + waitTime + extractDouble(shuttleLeg.getDuration()) + extractDouble(walkToDest.getDuration());
        String totalDuration = (int) totalMins + minutes;

        return new OutdoorDirectionResponse(totalDistance, totalDuration,
                walkToBus.getPolyline() + shuttleLeg.getPolyline() + walkToDest.getPolyline(),
                TransportMode.SHUTTLE, allSteps);
    }

    private String findNextDeparture(LocalTime arrivalTime, String location) {
        DayOfWeek day = LocalDate.now().getDayOfWeek();
        List<String> schedule;

        if (day == DayOfWeek.FRIDAY) {
            schedule = location.equals("SGW") ? ShuttleConstants.SGW_FRIDAY : ShuttleConstants.LOY_FRIDAY;
        } else if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return null;
        } else {
            schedule = location.equals("SGW") ? ShuttleConstants.SGW_WEEKDAY : ShuttleConstants.LOY_WEEKDAY;
        }

        return schedule.stream()
                .map(LocalTime::parse)
                .filter(time -> time.isAfter(arrivalTime))
                .map(time -> time.format(DateTimeFormatter.ofPattern("HH:mm")))
                .findFirst()
                .orElse(null);
    }

    private String sumMetricStrings(String s1, String s2, String s3, String unit) {
        double total = extractDouble(s1) + extractDouble(s2) + extractDouble(s3);
        return (unit.equals("km")) ? String.format("%.2f km", total) : (int) total + minutes;
    }

    private double extractDouble(String s) {
        if (s == null) return 0;
        try {
            return Double.parseDouble(s.replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return 0;
        }
    }
}