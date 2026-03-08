package com.soen390.backend.controller;

import com.soen390.backend.exception.GoogleMapsDirectionEmptyException;
import com.soen390.backend.exception.GoogleMapsDirectionsApiException;
import com.soen390.backend.object.UniversalDirectionResponse;
import com.soen390.backend.service.UniversalRoutingService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UniversalRoutingController.class)
class UniversalRoutingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UniversalRoutingService universalRoutingService;

    @Test
    void getUniversalRoute_returnsOkOnSuccess() throws Exception {
        UniversalDirectionResponse mockResponse = Mockito.mock(UniversalDirectionResponse.class);

        when(universalRoutingService.getCompleteRoute(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/directions/universal")
                        .param("startBuilding", "H")
                        .param("startRoom", "H8-843")
                        .param("startFloor", "8")
                        .param("endBuilding", "VL")
                        .param("endRoom", "VL-101")
                        .param("endFloor", "1")
                        .param("avoidStairs", "false"))
                .andExpect(status().isOk());
    }

    @Test
    void getUniversalRoute_handlesEmptyDirectionException_returns404() throws Exception {
        when(universalRoutingService.getCompleteRoute(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenThrow(new GoogleMapsDirectionEmptyException("No route found"));

        mockMvc.perform(get("/api/directions/universal")
                        .param("startBuilding", "H")
                        .param("startRoom", "H-1")
                        .param("startFloor", "1")
                        .param("endBuilding", "VL")
                        .param("endRoom", "VL-1")
                        .param("endFloor", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No route found"));
    }

    @Test
    void getUniversalRoute_handlesApiException_returns502() throws Exception {
        when(universalRoutingService.getCompleteRoute(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenThrow(new GoogleMapsDirectionsApiException("API Down"));

        mockMvc.perform(get("/api/directions/universal")
                        .param("startBuilding", "H")
                        .param("startRoom", "H-1")
                        .param("startFloor", "1")
                        .param("endBuilding", "VL")
                        .param("endRoom", "VL-1")
                        .param("endFloor", "1"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("API Down"));
    }

    @Test
    void getUniversalRoute_handlesGenericException_returns500() throws Exception {
        when(universalRoutingService.getCompleteRoute(
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
                .thenThrow(new RuntimeException("Unexpected server crash"));

        mockMvc.perform(get("/api/directions/universal")
                        .param("startBuilding", "H")
                        .param("startRoom", "H-1")
                        .param("startFloor", "1")
                        .param("endBuilding", "VL")
                        .param("endRoom", "VL-1")
                        .param("endFloor", "1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Unexpected server crash"));
    }
}