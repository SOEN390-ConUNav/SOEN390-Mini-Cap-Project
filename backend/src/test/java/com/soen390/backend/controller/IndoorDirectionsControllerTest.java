package com.soen390.backend.controller;

import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.service.IndoorDirectionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IndoorDirectionsController.class)
class IndoorDirectionsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IndoorDirectionService indoorDirectionService;

    @Test
    void getIndoorDirections_returnsOkWithRoute() throws Exception {
        IndoorDirectionResponse mockResponse = new IndoorDirectionResponse(
                "—", "—",
                new IndoorDirectionResponse.BuildingInfo("Hall Building", "Hall-8", "8", "8"),
                List.of(),
                List.of(
                        new IndoorDirectionResponse.RoutePoint(100, 200, "H8-843"),
                        new IndoorDirectionResponse.RoutePoint(150, 250, "wp1"),
                        new IndoorDirectionResponse.RoutePoint(200, 300, "H8-807")
                ));

        when(indoorDirectionService.getIndoorDirections(
                eq("Hall-8"), eq("H8-843"), eq("H8-807"), eq("8"), eq("8")))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/directions/indoor")
                        .param("buildingId", "Hall-8")
                        .param("origin", "H8-843")
                        .param("destination", "H8-807")
                        .param("originFloor", "8")
                        .param("destinationFloor", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buildingName").value("Hall Building"))
                .andExpect(jsonPath("$.routePoints", hasSize(3)))
                .andExpect(jsonPath("$.distance").value("—"));
    }

    @Test
    void getAvailableRooms_returnsRoomList() throws Exception {
        when(indoorDirectionService.getAvailableRooms("H", "8"))
                .thenReturn(List.of("H8-843", "H8-807", "H8-801"));

        mockMvc.perform(get("/api/directions/indoor/rooms")
                        .param("buildingId", "H")
                        .param("floor", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0]").value("H8-843"));
    }

    @Test
    void getWaypoints_returnsWaypointList() throws Exception {
        when(indoorDirectionService.getWaypoints("H", "8"))
                .thenReturn(List.of(
                        new IndoorDirectionsController.WaypointResponse(100, 200, "wp1"),
                        new IndoorDirectionsController.WaypointResponse(150, 250, "wp2")));

        mockMvc.perform(get("/api/directions/indoor/waypoints")
                        .param("buildingId", "H")
                        .param("floor", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value("wp1"));
    }

    @Test
    void getRoomPoints_returnsRoomPointList() throws Exception {
        when(indoorDirectionService.getRoomPoints("H", "8"))
                .thenReturn(List.of(
                        new IndoorDirectionsController.RoomPointResponse(100, 200, "H8-843")));

        mockMvc.perform(get("/api/directions/indoor/room-points")
                        .param("buildingId", "H")
                        .param("floor", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value("H8-843"));
    }

    @Test
    void getPois_returnsPoiList() throws Exception {
        when(indoorDirectionService.getPointsOfInterest("LB", "2"))
                .thenReturn(List.of(
                        new IndoorDirectionsController.PoiResponse(
                                100, 200, "Elevator-1", "Elevator", "elevator")));

        mockMvc.perform(get("/api/directions/indoor/pois")
                        .param("buildingId", "LB")
                        .param("floor", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("elevator"))
                .andExpect(jsonPath("$[0].displayName").value("Elevator"));
    }

    @Test
    void getIndoorDirections_missingRequiredParam_returns400() throws Exception {
        mockMvc.perform(get("/api/directions/indoor")
                        .param("buildingId", "Hall-8")
                        .param("origin", "H8-843"))
          
                .andExpect(status().isBadRequest());
    }

    @Test
    void getIndoorDirections_blankBuildingId_returns400() throws Exception {
        mockMvc.perform(get("/api/directions/indoor")
                        .param("buildingId", "   ")
                        .param("origin", "H8-843")
                        .param("destination", "H8-807"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("buildingId")));
    }

    @Test
    void getIndoorDirections_unknownBuildingId_returns400() throws Exception {
        mockMvc.perform(get("/api/directions/indoor")
                        .param("buildingId", "XX-99")
                        .param("origin", "room1")
                        .param("destination", "room2"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Unknown building ID")));
    }

    @Test
    void getIndoorDirections_sameOriginAndDestination_returns400() throws Exception {
        mockMvc.perform(get("/api/directions/indoor")
                        .param("buildingId", "Hall-8")
                        .param("origin", "H8-843")
                        .param("destination", "H8-843"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("different")));
    }

    @Test
    void getAvailableRooms_unknownBuilding_returns400() throws Exception {
        mockMvc.perform(get("/api/directions/indoor/rooms")
                        .param("buildingId", "ZZ"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Unknown building ID")));
    }



    @Test
    void getIndoorDirections_emptyRoute_returns404() throws Exception {
        IndoorDirectionResponse emptyRouteResponse = new IndoorDirectionResponse(
                "—", "—",
                new IndoorDirectionResponse.BuildingInfo("Hall Building", "Hall-8", "8", "8"),
                List.of(), List.of());

        when(indoorDirectionService.getIndoorDirections(
                eq("Hall-8"), eq("H8-843"), eq("H8-999"), eq("8"), eq("8")))
                .thenReturn(emptyRouteResponse);

        mockMvc.perform(get("/api/directions/indoor")
                        .param("buildingId", "Hall-8")
                        .param("origin", "H8-843")
                        .param("destination", "H8-999")
                        .param("originFloor", "8")
                        .param("destinationFloor", "8"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", containsString("No route found")));
    }

    @Test
    void getAvailableRooms_emptyResult_returns404() throws Exception {
        when(indoorDirectionService.getAvailableRooms("H", "99"))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/directions/indoor/rooms")
                        .param("buildingId", "H")
                        .param("floor", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", containsString("No rooms found")));
    }

    @Test
    void getWaypoints_emptyResult_returns404() throws Exception {
        when(indoorDirectionService.getWaypoints("H", "99"))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/directions/indoor/waypoints")
                        .param("buildingId", "H")
                        .param("floor", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", containsString("No waypoints found")));
    }

    @Test
    void getRoomPoints_emptyResult_returns404() throws Exception {
        when(indoorDirectionService.getRoomPoints("H", "99"))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/directions/indoor/room-points")
                        .param("buildingId", "H")
                        .param("floor", "99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", containsString("No room points found")));
    }
}
