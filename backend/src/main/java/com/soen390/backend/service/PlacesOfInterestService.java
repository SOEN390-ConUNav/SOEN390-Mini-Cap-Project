package com.soen390.backend.service;

import com.soen390.backend.enums.PlaceType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class PlacesOfInterestService {

    @Value("${google.api.key}")
    private String apiKey;

    private RestClient restClient;

    @Autowired
    public PlacesOfInterestService() {
        this.restClient = RestClient.create();
    }

    public PlacesOfInterestService(RestClient restClient) {
        this.restClient = restClient;
    }

    public String getNearbyPlaces(int maxResultCount, double radius, double lat, double lng, PlaceType placeType) {
        Map<String, Object> body = Map.of(
                "includedTypes", List.of(placeType.toString().toLowerCase()),
                "maxResultCount", maxResultCount,
                "locationRestriction", Map.of(
                        "circle", Map.of(
                                "center", Map.of(
                                        "latitude", lat,
                                        "longitude", lng
                                ),
                                "radius", radius
                        )
                )
        );
        String rawJson;
        try {
            rawJson = restClient.post()
                    .uri("https://places.googleapis.com/v1/places:searchNearby")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.nationalPhoneNumber")
                    .body(body)
                    .retrieve()
                    .body(String.class);

        } catch (Exception e) {
            throw new IllegalStateException("Google Places API returned an empty response", e);
        }

        return rawJson;
    }

    public String searchPlacesByText(String query, double lat, double lng) {
        Map<String, Object> body = Map.of(
                "textQuery", query,
                "locationBias", Map.of(
                        "circle", Map.of(
                                "center", Map.of(
                                        "latitude", lat,
                                        "longitude", lng
                                ),
                                "radius", 5000
                        )
                )
        );

        String rawJson;
        try {
            rawJson = restClient.post()
                    .uri("https://places.googleapis.com/v1/places:searchText")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask",
                            "places.displayName,places.formattedAddress,places.location")
                    .body(body)
                    .retrieve()
                    .body(String.class);

        } catch (Exception e) {
            throw new IllegalStateException("Google Places Text Search returned an empty response", e);
        }

        return rawJson;
    }

}
