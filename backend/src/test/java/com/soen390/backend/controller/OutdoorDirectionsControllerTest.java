package com.soen390.backend.controller;

import com.soen390.backend.config.RestTemplateConfig;
import com.soen390.backend.exception.GoogleMapsDirectionEmptyException;
import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.object.RouteStep;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.service.GoogleMapsService;
import com.soen390.backend.service.ShuttleOutdoorDirectionsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OutdoorDirectionsController.class)
@Import(RestTemplateConfig.class)
class OutdoorDirectionsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GoogleMapsService googleMapsService;

    @MockitoBean
    private ShuttleOutdoorDirectionsService shuttleOutdoorDirectionsService;

    @Test
    void getDirectionsShouldReturn200AndJson() throws Exception {
        List<RouteStep> mockSteps = new ArrayList<>();

        OutdoorDirectionResponse mockResponse = new OutdoorDirectionResponse(
                "1.2 km",
                "15 mins",
                "dummy polyline",
                TransportMode.WALKING,
                mockSteps
        );

        when(googleMapsService.getDirections(any(), any(), any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/directions/outdoor")
                        .param("origin", "Concordia")
                        .param("destination", "McGill")
                        .param("transportMode", "walking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distance").value("1.2 km"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void getDirectionsShouldReturn404WhenDirectionsNotFound() throws Exception {
        when(googleMapsService.getDirections(any(), any(), any()))
                .thenThrow(new GoogleMapsDirectionEmptyException("Directions not found. Please check your start and end locations."));

        mockMvc.perform(get("/api/directions/outdoor")
                        .param("origin", "god")
                        .param("destination", "McGill")
                        .param("transportMode", "walking"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Directions not found. Please check your start and end locations."))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void getDirectionsShouldReturn502OnApiError() throws Exception {
        when(googleMapsService.getDirections(any(), any(), any()))
                .thenThrow(new GoogleMapsDirectionsApiException("Unexpected error from Google Maps API."));

        mockMvc.perform(get("/api/directions/outdoor")
                        .param("origin", "Concordia")
                        .param("destination", "McGill")
                        .param("transportMode", "walking"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("Unexpected error from Google Maps API."))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void getDirectionsShouldResolveBuildingIdsToBackendAddresses() throws Exception {
        List<RouteStep> mockSteps = new ArrayList<>();

        OutdoorDirectionResponse mockResponse = new OutdoorDirectionResponse(
                "1.2 km",
                "15 mins",
                "dummy polyline",
                TransportMode.WALKING,
                mockSteps
        );

        when(googleMapsService.getDirections(
                eq("1450 Guy St, Montreal, QC"),
                eq("Concordia University, Henry F. Hall (H) Building, 1455 Blvd. De Maisonneuve Ouest, Montreal, Quebec H3G 1M8"),
                eq(TransportMode.WALKING)
        )).thenReturn(mockResponse);

        mockMvc.perform(get("/api/directions/outdoor")
                        .param("origin", "45.495,-73.579")
                        .param("destination", "45.497,-73.579")
                        .param("originBuildingId", "MB")
                        .param("destinationBuildingId", "H")
                        .param("transportMode", "walking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distance").value("1.2 km"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void getDirectionsShouldResolveLoyolaBuildingIdsToEntranceCoordinates() throws Exception {
        List<RouteStep> mockSteps = new ArrayList<>();

        OutdoorDirectionResponse mockResponse = new OutdoorDirectionResponse(
                "300 m",
                "4 mins",
                "dummy polyline",
                TransportMode.WALKING,
                mockSteps
        );

        when(googleMapsService.getDirections(
                eq("45.458899,-73.639073"),
                eq("45.45793,-73.63957"),
                eq(TransportMode.WALKING)
        )).thenReturn(mockResponse);

        mockMvc.perform(get("/api/directions/outdoor")
                        .param("origin", "7141 Sherbrooke")
                        .param("destination", "7141 Sherbrooke")
                        .param("originBuildingId", "VE")
                        .param("destinationBuildingId", "CC")
                        .param("transportMode", "walking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distance").value("300 m"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

}
