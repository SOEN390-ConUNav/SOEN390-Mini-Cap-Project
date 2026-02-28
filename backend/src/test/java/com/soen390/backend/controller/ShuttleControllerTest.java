package com.soen390.backend.controller;

import com.soen390.backend.enums.Campus;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.exception.GoogleMapsDirectionEmptyException;
import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.service.GoogleMapsService;
import com.soen390.backend.service.ShuttleOutdoorDirectionsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OutdoorDirectionsController.class)
class ShuttleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GoogleMapsService googleMapsService; // required by constructor

    @MockBean
    private ShuttleOutdoorDirectionsService shuttleOutdoorDirectionsService;

    private static final String BASE_URL = "/api/directions/outdoor/shuttle";

    @Test
    void testGetDirectionsWithShuttle_Success() throws Exception {
        OutdoorDirectionResponse mockResponse = new OutdoorDirectionResponse(
                "6.50 km", "30 mins", "polyline123", TransportMode.shuttle, new ArrayList<>());

        when(shuttleOutdoorDirectionsService.getShuttleOutdoorDirections(anyString(), anyString(), any(Campus.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(get(BASE_URL)
                        .param("origin", "SGW_Start")
                        .param("destination", "LOY_End")
                        .param("destinationShuttle", "LOYOLA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distance").value("6.50 km"))
                .andExpect(jsonPath("$.duration").value("30 mins"))
                .andExpect(jsonPath("$.transportMode").value("shuttle"));
    }

    @Test
    void testGetDirectionsWithShuttle_ReturnsNullWhenNoShuttle() throws Exception {
        when(shuttleOutdoorDirectionsService.getShuttleOutdoorDirections(anyString(), anyString(), any(Campus.class)))
                .thenReturn(null);

        mockMvc.perform(get(BASE_URL)
                        .param("origin", "SGW_Start")
                        .param("destination", "LOY_End")
                        .param("destinationShuttle", "LOYOLA"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetDirectionsWithShuttle_NotFound() throws Exception {
        when(shuttleOutdoorDirectionsService.getShuttleOutdoorDirections(anyString(), anyString(), any(Campus.class)))
                .thenThrow(new GoogleMapsDirectionEmptyException("No route found"));

        mockMvc.perform(get(BASE_URL)
                        .param("origin", "SGW_Start")
                        .param("destination", "LOY_End")
                        .param("destinationShuttle", "LOYOLA"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No route found"));
    }

    @Test
    void testGetDirectionsWithShuttle_BadGateway() throws Exception {
        when(shuttleOutdoorDirectionsService.getShuttleOutdoorDirections(anyString(), anyString(), any(Campus.class)))
                .thenThrow(new GoogleMapsDirectionsApiException("Google Maps API failed"));

        mockMvc.perform(get(BASE_URL)
                        .param("origin", "SGW_Start")
                        .param("destination", "LOY_End")
                        .param("destinationShuttle", "LOYOLA"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("Google Maps API failed"));
    }

    @Test
    void testGetDirectionsWithShuttle_MissingParams() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .param("origin", "SGW_Start"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetDirectionsWithShuttle_InvalidCampusEnum() throws Exception {
        mockMvc.perform(get(BASE_URL)
                        .param("origin", "SGW_Start")
                        .param("destination", "LOY_End")
                        .param("destinationShuttle", "INVALID_CAMPUS"))
                .andExpect(status().isBadRequest());
    }
}