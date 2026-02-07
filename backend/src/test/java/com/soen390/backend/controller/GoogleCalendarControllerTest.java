package com.soen390.backend.controller;

import com.soen390.backend.config.RestTemplateConfig;
import com.soen390.backend.object.GoogleCalendarDto;
import com.soen390.backend.object.GoogleEventDto;
import com.soen390.backend.service.GoogleCalendarService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GoogleCalendarController.class)
@Import(RestTemplateConfig.class)
public class GoogleCalendarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GoogleCalendarService googleCalendarService;

    // ========== GET /api/google/calendars Tests ==========

    @Test
    void testListCalendarsSuccess() throws Exception {
        List<GoogleCalendarDto> calendars = Arrays.asList(
                new GoogleCalendarDto("cal1@google.com", "Primary Calendar", true),
                new GoogleCalendarDto("cal2@google.com", "Work Calendar", false)
        );

        when(googleCalendarService.listCalendars("valid-session-id")).thenReturn(calendars);

        mockMvc.perform(get("/api/google/calendars")
                        .header("X-Session-Id", "valid-session-id"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("cal1@google.com"))
                .andExpect(jsonPath("$[0].summary").value("Primary Calendar"))
                .andExpect(jsonPath("$[0].primary").value(true))
                .andExpect(jsonPath("$[1].id").value("cal2@google.com"))
                .andExpect(jsonPath("$[1].summary").value("Work Calendar"))
                .andExpect(jsonPath("$[1].primary").value(false));
    }

    @Test
    void testListCalendarsEmptyList() throws Exception {
        when(googleCalendarService.listCalendars("valid-session-id"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/google/calendars")
                        .header("X-Session-Id", "valid-session-id"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testListCalendarsMissingSessionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/google/calendars"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testListCalendarsBlankSessionIdReturns400() throws Exception {
        when(googleCalendarService.listCalendars("   "))
                .thenThrow(new RuntimeException("Missing sessionId."));

        mockMvc.perform(get("/api/google/calendars")
                        .header("X-Session-Id", "   "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testListCalendarsInvalidSessionReturns401() throws Exception {
        when(googleCalendarService.listCalendars("invalid-session"))
                .thenThrow(new RuntimeException("Invalid sessionId (no stored Google session)."));

        mockMvc.perform(get("/api/google/calendars")
                        .header("X-Session-Id", "invalid-session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testListCalendarsExpiredSessionReturns401() throws Exception {
        when(googleCalendarService.listCalendars("expired-session"))
                .thenThrow(new RuntimeException("Session expired. Please sign in again."));

        mockMvc.perform(get("/api/google/calendars")
                        .header("X-Session-Id", "expired-session"))
                .andExpect(status().isUnauthorized());
    }

    // ========== GET /api/google/calendars/{calendarId}/events Tests ==========

    @Test
    void testImportCalendarSuccess() throws Exception {
        List<GoogleEventDto> events = Arrays.asList(
                new GoogleEventDto("event1", "Meeting", "Room 101",
                        "2024-01-15T10:00:00-05:00", "2024-01-15T11:00:00-05:00", false),
                new GoogleEventDto("event2", "All Day Event", null,
                        "2024-01-16", "2024-01-17", true)
        );

        when(googleCalendarService.importEvents("valid-session", "calendar-id", 7, "America/Montreal"))
                .thenReturn(events);

        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("event1"))
                .andExpect(jsonPath("$[0].summary").value("Meeting"))
                .andExpect(jsonPath("$[0].location").value("Room 101"))
                .andExpect(jsonPath("$[0].start").value("2024-01-15T10:00:00-05:00"))
                .andExpect(jsonPath("$[0].end").value("2024-01-15T11:00:00-05:00"))
                .andExpect(jsonPath("$[0].allDay").value(false))
                .andExpect(jsonPath("$[1].id").value("event2"))
                .andExpect(jsonPath("$[1].allDay").value(true));
    }

    @Test
    void testImportCalendarWithCustomDaysParameter() throws Exception {
        when(googleCalendarService.importEvents("valid-session", "calendar-id", 14, "America/Montreal"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "valid-session")
                        .param("days", "14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testImportCalendarWithCustomTimeZone() throws Exception {
        when(googleCalendarService.importEvents("valid-session", "calendar-id", 7, "America/New_York"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "valid-session")
                        .param("timeZone", "America/New_York"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testImportCalendarWithAllParameters() throws Exception {
        when(googleCalendarService.importEvents("valid-session", "my-calendar", 30, "Europe/London"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/google/calendars/my-calendar/events")
                        .header("X-Session-Id", "valid-session")
                        .param("days", "30")
                        .param("timeZone", "Europe/London"))
                .andExpect(status().isOk());
    }

    @Test
    void testImportCalendarMissingSessionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/google/calendars/calendar-id/events"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testImportCalendarBlankSessionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "   "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testImportCalendarEmptySessionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", ""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testImportCalendarInvalidSessionReturns401() throws Exception {
        when(googleCalendarService.importEvents(eq("invalid-session"), anyString(), anyInt(), anyString()))
                .thenThrow(new RuntimeException("Invalid sessionId (no stored Google session)."));

        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "invalid-session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testImportCalendarGoogleApiErrorReturns401() throws Exception {
        when(googleCalendarService.importEvents(eq("valid-session"), anyString(), anyInt(), anyString()))
                .thenThrow(new RuntimeException("Google Events API error (404): Calendar not found"));

        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testImportCalendarWithEncodedCalendarId() throws Exception {
        when(googleCalendarService.importEvents("valid-session", "user@example.com", 7, "America/Montreal"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/google/calendars/user@example.com/events")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isOk());
    }

    @Test
    void testImportCalendarReturnsEmptyList() throws Exception {
        when(googleCalendarService.importEvents("valid-session", "empty-calendar", 7, "America/Montreal"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/google/calendars/empty-calendar/events")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testImportCalendarEventWithNullLocation() throws Exception {
        List<GoogleEventDto> events = Collections.singletonList(
                new GoogleEventDto("event1", "No Location Event", null,
                        "2024-01-15T10:00:00-05:00", "2024-01-15T11:00:00-05:00", false)
        );

        when(googleCalendarService.importEvents("valid-session", "calendar-id", 7, "America/Montreal"))
                .thenReturn(events);

        mockMvc.perform(get("/api/google/calendars/calendar-id/events")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].location").doesNotExist());
        }

    // ========== GET /api/google/calendars/{calendarId}/next-event Tests ==========

    @Test
    void testGetNextEventSuccess() throws Exception {
        GoogleEventDto nextEvent = new GoogleEventDto(
                "event1",
                "Software Engineering Lecture",
                "Hall Building",
                "2026-02-09T10:00:00-05:00",
                "2026-02-09T11:15:00-05:00",
                false
        );

        when(googleCalendarService.getNextEvent("valid-session", "calendar-id", 7, "America/Montreal"))
                .thenReturn(nextEvent);

        mockMvc.perform(get("/api/google/calendars/calendar-id/next-event")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value("event1"))
                .andExpect(jsonPath("$.summary").value("Software Engineering Lecture"))
                .andExpect(jsonPath("$.location").value("Hall Building"))
                .andExpect(jsonPath("$.allDay").value(false));
    }

    @Test
    void testGetNextEventNoContent() throws Exception {
        when(googleCalendarService.getNextEvent("valid-session", "calendar-id", 7, "America/Montreal"))
                .thenReturn(null);

        mockMvc.perform(get("/api/google/calendars/calendar-id/next-event")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
    }

    @Test
    void testGetNextEventWithCustomParams() throws Exception {
        when(googleCalendarService.getNextEvent("valid-session", "calendar-id", 14, "America/New_York"))
                .thenReturn(null);

        mockMvc.perform(get("/api/google/calendars/calendar-id/next-event")
                        .header("X-Session-Id", "valid-session")
                        .param("days", "14")
                        .param("timeZone", "America/New_York"))
                .andExpect(status().isNoContent());
    }

    @Test
    void testGetNextEventMissingSessionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/google/calendars/calendar-id/next-event"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetNextEventBlankSessionIdReturns400() throws Exception {
        mockMvc.perform(get("/api/google/calendars/calendar-id/next-event")
                        .header("X-Session-Id", "   "))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetNextEventInvalidSessionReturns401() throws Exception {
        when(googleCalendarService.getNextEvent(eq("invalid-session"), anyString(), anyInt(), anyString()))
                .thenThrow(new RuntimeException("Invalid sessionId (no stored Google session)."));

        mockMvc.perform(get("/api/google/calendars/calendar-id/next-event")
                        .header("X-Session-Id", "invalid-session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGetNextEventWithEncodedCalendarId() throws Exception {
        when(googleCalendarService.getNextEvent("valid-session", "user@example.com", 7, "America/Montreal"))
                .thenReturn(null);

        mockMvc.perform(get("/api/google/calendars/user@example.com/next-event")
                        .header("X-Session-Id", "valid-session"))
                .andExpect(status().isNoContent());
    }

}

