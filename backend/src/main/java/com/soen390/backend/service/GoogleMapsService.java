package com.soen390.backend.service;

import com.soen390.backend.dto.OutdoorDirectionResponse;
import com.soen390.backend.dto.RouteStep;
import com.soen390.backend.enums.ManeuverType;
import com.soen390.backend.enums.TransportMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleMapsService {

    @Value("${google.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public GoogleMapsService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public OutdoorDirectionResponse getDirections(String origin, String destination, TransportMode transportMode) {

        String url = "https://maps.googleapis.com/maps/api/directions/json" +
                "?origin=" + origin +
                "&destination=" + destination +
                "&mode=" + transportMode +
                "&key=" + apiKey;

        String json = restTemplate.getForObject(url, String.class);

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            JsonNode route = root.path("routes").get(0);
            JsonNode leg = route.path("legs").get(0);

            String distance = leg.path("distance").path("text").asText();
            String duration = leg.path("duration").path("text").asText();
            String polyline = route.path("overview_polyline").path("points").asText();

            List<RouteStep> stepList = new ArrayList<>();
            JsonNode steps = leg.path("steps");

            JsonNode step1 = leg.path("steps").get(0);
            String modeOfTransport = step1.path("travel_mode").asText();
            TransportMode mode = TransportMode.valueOf(modeOfTransport.toLowerCase());

            for (JsonNode step : steps) {
                String instruction = step.path("html_instructions").asText();
                String cleanInstruction = instruction.replaceAll("<[^>]*>", "");

                String stepDist = step.path("distance").path("text").asText();
                String stepDur = step.path("duration").path("text").asText();
                ManeuverType maneuverType;
                if (!step.path("maneuver").isTextual()) {
                    maneuverType = ManeuverType.STRAIGHT;
                } else {
                    String maneuver = step.path("maneuver").asText();
                    maneuverType = ManeuverType.fromString(maneuver);
                }

                stepList.add(new RouteStep(cleanInstruction, stepDist, stepDur,maneuverType));
            }

            return new OutdoorDirectionResponse(distance, duration, polyline, mode, stepList);

        } catch (Exception e) {
            throw new RuntimeException("Error parsing Google Directions response");
        }
    }

}
