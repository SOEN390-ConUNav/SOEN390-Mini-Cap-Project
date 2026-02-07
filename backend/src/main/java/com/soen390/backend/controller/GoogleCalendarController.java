package com.soen390.backend.controller;

import com.soen390.backend.object.GoogleCalendarDto;
import com.soen390.backend.object.GoogleEventDto;
import com.soen390.backend.service.GoogleCalendarService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/google")
public class GoogleCalendarController {

  private final GoogleCalendarService googleCalendarService;

  public GoogleCalendarController(GoogleCalendarService googleCalendarService) {
    this.googleCalendarService = googleCalendarService;
  }

  @GetMapping("/calendars")
  public List<GoogleCalendarDto> calendars(@RequestHeader("X-Session-Id") String sessionId) {
    if (sessionId == null || sessionId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Session-Id header is required.");
    }

    try {
      return googleCalendarService.listCalendars(sessionId);
    } catch (RuntimeException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage(), e);
    }
  }

  @GetMapping("/calendars/{calendarId}/events")
  public List<GoogleEventDto> getCalendarEvents(
      @RequestHeader("X-Session-Id") String sessionId,
      @PathVariable String calendarId,
      @RequestParam(defaultValue = "7") int days,
      @RequestParam(defaultValue = "America/Montreal") String timeZone
  ) {
    if (sessionId == null || sessionId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Session-Id header is required.");
    }

    try {
      return googleCalendarService.importEvents(sessionId, calendarId, days, timeZone);
    } catch (RuntimeException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage(), e);
    }
  }

  @GetMapping("/calendars/{calendarId}/next-event")
  public ResponseEntity<GoogleEventDto> getNextEvent(
      @RequestHeader("X-Session-Id") String sessionId,
      @PathVariable String calendarId,
      @RequestParam(defaultValue = "7") int days,
      @RequestParam(defaultValue = "America/Montreal") String timeZone
  ) {
    if (sessionId == null || sessionId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Session-Id header is required.");
    }

    try {
      GoogleEventDto nextEvent = googleCalendarService.getNextEvent(sessionId, calendarId, days, timeZone);
      if (nextEvent == null) {
        return ResponseEntity.noContent().build();
      }
      return ResponseEntity.ok(nextEvent);
    } catch (RuntimeException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage(), e);
    }
  }

  @PutMapping("/selected-calendar")
  public Map<String, Object> setSelectedCalendar(
      @RequestHeader("X-Session-Id") String sessionId,
      @RequestBody Map<String, Object> body
  ) {
    if (sessionId == null || sessionId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Session-Id header is required.");
    }

    if (body == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
    }

    Object idObj = body.get("id");
    if (!(idObj instanceof String calendarId) || calendarId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "calendar.id is required.");
    }

    String summary = (body.get("summary") instanceof String s && !s.isBlank()) ? s : "(no name)";
    boolean primary = body.get("primary") instanceof Boolean b && b;

    try {
      googleCalendarService.setSelectedCalendar(sessionId, new GoogleCalendarDto(calendarId, summary, primary));
      return Map.of(
          "saved", true,
          "selectedCalendar", new GoogleCalendarDto(calendarId, summary, primary)
      );
    } catch (RuntimeException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage(), e);
    }
  }

  @GetMapping("/state")
  public Map<String, Object> state(
      @RequestHeader("X-Session-Id") String sessionId,
      @RequestParam(defaultValue = "7") int days,
      @RequestParam(defaultValue = "America/Montreal") String timeZone,
      @RequestParam(defaultValue = "false") boolean includeCalendars
  ) {
    if (sessionId == null || sessionId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-Session-Id header is required.");
    }

    try {
      return googleCalendarService.getState(sessionId, days, timeZone, includeCalendars);
    } catch (RuntimeException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage(), e);
    }
  }

}
