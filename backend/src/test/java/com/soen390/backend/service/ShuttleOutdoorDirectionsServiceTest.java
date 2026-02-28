package com.soen390.backend.service;

import com.soen390.backend.enums.*;
import com.soen390.backend.object.*;
import org.junit.jupiter.api.*;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ShuttleOutdoorDirectionsServiceTest {

    @Mock
    private GoogleMapsService googleMapsService;

    @InjectMocks
    private ShuttleOutdoorDirectionsService shuttleService;

    private AutoCloseable closeable;

    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
    }

    @AfterEach
    void tearDown() throws Exception {
        closeable.close();
    }

    @Test
    void testGetShuttleOutdoorDirections_AlwaysSuccess() {
        LocalDate monday = LocalDate.of(2026, 2, 23);
        LocalTime tenAM = LocalTime.of(10, 0);

        try (MockedStatic<LocalDate> mockedDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS);
             MockedStatic<LocalTime> mockedTime = mockStatic(LocalTime.class, CALLS_REAL_METHODS)) {

            mockedDate.when(LocalDate::now).thenReturn(monday);
            mockedTime.when(() -> LocalTime.now(java.time.ZoneId.of("America/Montreal"))).thenReturn(tenAM);

            OutdoorDirectionResponse walk1 = new OutdoorDirectionResponse(
                    "1.0 km", "5 mins", "p1", TransportMode.walking, new ArrayList<>());
            OutdoorDirectionResponse shuttle = new OutdoorDirectionResponse(
                    "5.0 km", "10 mins", "p2", TransportMode.transit, new ArrayList<>());
            OutdoorDirectionResponse walk2 = new OutdoorDirectionResponse(
                    "0.5 km", "5 mins", "p3", TransportMode.walking, new ArrayList<>());

            when(googleMapsService.getDirections(anyString(), anyString(), any(TransportMode.class)))
                    .thenReturn(walk1)
                    .thenReturn(shuttle)
                    .thenReturn(walk2);

            OutdoorDirectionResponse result = shuttleService.getShuttleOutdoorDirections(
                    "SGW_Start", "LOY_End", Campus.LOYOLA);

            assertNotNull(result);
            assertEquals(TransportMode.shuttle, result.getTransportMode());
            assertEquals("6.50 km", result.getDistance());
            // Walk(5) + Wait(10 mins to next shuttle after 10:05) + Shuttle(10) + Walk(5) = 30 mins
            assertEquals("30 mins", result.getDuration());
        }
    }

    @Test
    void testGetShuttleOutdoorDirections_ReturnsNullOnWeekend() {
        LocalDate sunday = LocalDate.of(2026, 2, 22);
        LocalTime tenAM = LocalTime.of(10, 0);

        try (MockedStatic<LocalDate> mockedDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS);
             MockedStatic<LocalTime> mockedTime = mockStatic(LocalTime.class, CALLS_REAL_METHODS)) {

            mockedDate.when(LocalDate::now).thenReturn(sunday);
            mockedTime.when(() -> LocalTime.now(java.time.ZoneId.of("America/Montreal"))).thenReturn(tenAM);

            OutdoorDirectionResponse dummy = new OutdoorDirectionResponse(
                    "1 km", "5 mins", "p", TransportMode.walking, new ArrayList<>());
            when(googleMapsService.getDirections(anyString(), anyString(), any(TransportMode.class)))
                    .thenReturn(dummy);

            OutdoorDirectionResponse result = shuttleService.getShuttleOutdoorDirections(
                    "A", "B", Campus.LOYOLA);

            assertNull(result, "Should be null because shuttle doesn't run on Sundays");
        }
    }

    @Test
    void testGetShuttleOutdoorDirections_ToSGW() {
        LocalDate monday = LocalDate.of(2026, 2, 23);
        LocalTime tenAM = LocalTime.of(10, 0);

        try (MockedStatic<LocalDate> mockedDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS);
             MockedStatic<LocalTime> mockedTime = mockStatic(LocalTime.class, CALLS_REAL_METHODS)) {

            mockedDate.when(LocalDate::now).thenReturn(monday);
            mockedTime.when(() -> LocalTime.now(java.time.ZoneId.of("America/Montreal"))).thenReturn(tenAM);

            OutdoorDirectionResponse walk1 = new OutdoorDirectionResponse(
                    "1.0 km", "5 mins", "p1", TransportMode.walking, new ArrayList<>());
            OutdoorDirectionResponse shuttle = new OutdoorDirectionResponse(
                    "5.0 km", "10 mins", "p2", TransportMode.transit, new ArrayList<>());
            OutdoorDirectionResponse walk2 = new OutdoorDirectionResponse(
                    "0.5 km", "5 mins", "p3", TransportMode.walking, new ArrayList<>());

            when(googleMapsService.getDirections(anyString(), anyString(), any(TransportMode.class)))
                    .thenReturn(walk1)
                    .thenReturn(shuttle)
                    .thenReturn(walk2);

            OutdoorDirectionResponse result = shuttleService.getShuttleOutdoorDirections(
                    "LOY_Start", "SGW_End", Campus.SGW);

            assertNotNull(result);
            assertEquals(TransportMode.shuttle, result.getTransportMode());
            assertEquals("6.50 km", result.getDistance());
        }
    }

    @Test
    void testGetShuttleOutdoorDirections_NoMoreShuttlesToday() {
        LocalDate monday = LocalDate.of(2026, 2, 23);
        LocalTime lateNight = LocalTime.of(23, 0); // After last shuttle

        try (MockedStatic<LocalDate> mockedDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS);
             MockedStatic<LocalTime> mockedTime = mockStatic(LocalTime.class, CALLS_REAL_METHODS)) {

            mockedDate.when(LocalDate::now).thenReturn(monday);
            mockedTime.when(() -> LocalTime.now(java.time.ZoneId.of("America/Montreal"))).thenReturn(lateNight);

            OutdoorDirectionResponse dummy = new OutdoorDirectionResponse(
                    "1 km", "5 mins", "p", TransportMode.walking, new ArrayList<>());
            when(googleMapsService.getDirections(anyString(), anyString(), any(TransportMode.class)))
                    .thenReturn(dummy);

            OutdoorDirectionResponse result = shuttleService.getShuttleOutdoorDirections(
                    "SGW_Start", "LOY_End", Campus.LOYOLA);

            assertNull(result, "Should be null when no more shuttles are scheduled");
        }
    }

    @Test
    void testGetShuttleOutdoorDirections_Friday() {
        LocalDate friday = LocalDate.of(2026, 2, 27);
        LocalTime tenAM = LocalTime.of(10, 0);

        try (MockedStatic<LocalDate> mockedDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS);
             MockedStatic<LocalTime> mockedTime = mockStatic(LocalTime.class, CALLS_REAL_METHODS)) {

            mockedDate.when(LocalDate::now).thenReturn(friday);
            mockedTime.when(() -> LocalTime.now(java.time.ZoneId.of("America/Montreal"))).thenReturn(tenAM);

            OutdoorDirectionResponse walk1 = new OutdoorDirectionResponse(
                    "1.0 km", "5 mins", "p1", TransportMode.walking, new ArrayList<>());
            OutdoorDirectionResponse shuttle = new OutdoorDirectionResponse(
                    "5.0 km", "10 mins", "p2", TransportMode.transit, new ArrayList<>());
            OutdoorDirectionResponse walk2 = new OutdoorDirectionResponse(
                    "0.5 km", "5 mins", "p3", TransportMode.walking, new ArrayList<>());

            when(googleMapsService.getDirections(anyString(), anyString(), any(TransportMode.class)))
                    .thenReturn(walk1)
                    .thenReturn(shuttle)
                    .thenReturn(walk2);

            OutdoorDirectionResponse result = shuttleService.getShuttleOutdoorDirections(
                    "SGW_Start", "LOY_End", Campus.LOYOLA);

            assertNotNull(result, "Friday shuttle should still run");
            assertEquals(TransportMode.shuttle, result.getTransportMode());
        }
    }
}