package com.soen390.backend.service;

import com.soen390.backend.enums.BuildingLocation;
import com.soen390.backend.enums.TransportMode;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.object.OutdoorDirectionResponse;
import com.soen390.backend.object.ShuttleSchedule;
import com.soen390.backend.object.UniversalDirectionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UniversalRoutingServiceTest {

    @Mock
    private IndoorDirectionService indoorDirectionService;

    @Mock
    private GoogleMapsService googleMapsService;

    @Mock
    private ShuttleScheduleService shuttleScheduleService;

    @InjectMocks
    private UniversalRoutingService universalRoutingService;

    private IndoorDirectionResponse mockIndoorLeg;
    private OutdoorDirectionResponse mockOutdoorLeg;

    @BeforeEach
    void setUp() {
        mockIndoorLeg = mock(IndoorDirectionResponse.class);
        mockOutdoorLeg = mock(OutdoorDirectionResponse.class);

        lenient().when(indoorDirectionService.getIndoorDirections(
                any(), any(), any(), any(), any(), anyBoolean())).thenReturn(mockIndoorLeg);
        lenient().when(googleMapsService.getDirections(any(), any(), any())).thenReturn(mockOutdoorLeg);
        lenient().when(mockIndoorLeg.getDuration()).thenReturn("5 mins");
        lenient().when(mockOutdoorLeg.getDuration()).thenReturn("15 mins");
    }

    @Test
    void getCompleteRoute_sameCampus_usesWalkingAndNoShuttle() {
        String startBuilding = "H";
        String endBuilding = "MB";

        UniversalDirectionResponse response = universalRoutingService.getCompleteRoute(
                startBuilding, "H8-843", "8",
                endBuilding, "MB-101", "1", false
        );

        verify(googleMapsService).getDirections(
                BuildingLocation.H.address,
                BuildingLocation.MB.address,
                TransportMode.walking
        );
        assertNull(response.getNextShuttleTime());
        assertEquals("Approx 15 mins + indoor walking time.", response.getTotalDuration());
    }

    @Test
    void getCompleteRoute_differentCampus_usesTransitAndFindsShuttle() {
        String startBuilding = "H";
        String endBuilding = "VL";

        ShuttleSchedule mockSchedule = new ShuttleSchedule();
        mockSchedule.setCampus("SGW");
        mockSchedule.setDayType("weekday");
        mockSchedule.setDepartureTimes(List.of("00:01", "23:59"));

        when(shuttleScheduleService.getSchedules()).thenReturn(List.of(mockSchedule));

        UniversalDirectionResponse response = universalRoutingService.getCompleteRoute(
                startBuilding, "H8-843", "8",
                endBuilding, "VL-101", "1", false
        );

        verify(googleMapsService).getDirections(
                BuildingLocation.H.address,
                BuildingLocation.VL.address,
                TransportMode.transit
        );
        assertEquals("23:59", response.getNextShuttleTime());
    }

    @Test
    void getCompleteRoute_differentCampus_noShuttlesLeft() {
        ShuttleSchedule mockSchedule = new ShuttleSchedule();
        mockSchedule.setCampus("SGW");
        mockSchedule.setDayType("weekday");

        mockSchedule.setDepartureTimes(List.of("00:00"));

        when(shuttleScheduleService.getSchedules()).thenReturn(List.of(mockSchedule));

        UniversalDirectionResponse response = universalRoutingService.getCompleteRoute(
                "H", "H-1", "1", "VL", "VL-1", "1", false
        );

        assertEquals("No more shuttles today", response.getNextShuttleTime());
    }

    @Test
    void getCompleteRoute_handlesNullBuildingIds_usesDefaults() {
        UniversalDirectionResponse response = universalRoutingService.getCompleteRoute(
                null, "room1", "1",
                null, "room2", "1", false
        );

        verify(indoorDirectionService).getIndoorDirections(
                eq(null), eq("room1"), eq("main-entrance"), eq("1"), eq("1"), anyBoolean()
        );
        assertNotNull(response);
    }

    @Test
    void getCompleteRoute_testsAllBuildingPrefixes_forEntrancesAndFloors() {
        universalRoutingService.getCompleteRoute("CC", "r1", "1", "H", "r2", "1", false);
        verify(indoorDirectionService).getIndoorDirections(
                eq("CC"), eq("r1"), eq("CC-Entrance-Exit"), eq("1"), eq("1"), anyBoolean());

        universalRoutingService.getCompleteRoute("LB", "r1", "1", "H", "r2", "1", false);
        verify(indoorDirectionService).getIndoorDirections(
                eq("LB"), eq("r1"), eq("LB2-Emergency-Exit-1"), eq("1"), eq("2"), anyBoolean());

        universalRoutingService.getCompleteRoute("VE", "r1", "1", "H", "r2", "1", false);
        verify(indoorDirectionService).getIndoorDirections(
                eq("VE"), eq("r1"), eq("VE1-Entrance/exit"), eq("1"), eq("1"), anyBoolean());

        universalRoutingService.getCompleteRoute("VL", "r1", "1", "H", "r2", "1", false);
        verify(indoorDirectionService).getIndoorDirections(
                eq("VL"), eq("r1"), eq("VL-101"), eq("1"), eq("1"), anyBoolean());

        universalRoutingService.getCompleteRoute("MB", "r1", "1", "H", "r2", "1", false);
        verify(indoorDirectionService).getIndoorDirections(
                eq("MB"), eq("r1"), eq("MB1-Main-Entrance"), eq("1"), eq("1"), anyBoolean());
    }

    @Test
    void getCompleteRoute_unknownBuildingPrefix_usesMainEntrance() {
        // Covers getBuildingEntranceId fallback for unknown prefix
        universalRoutingService.getCompleteRoute("XX", "r1", "1", "H", "r2", "1", false);
        verify(indoorDirectionService).getIndoorDirections(
                eq("XX"), eq("r1"), eq("main-entrance"), eq("1"), eq("1"), anyBoolean());
    }
}
