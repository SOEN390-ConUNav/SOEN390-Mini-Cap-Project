package com.soen390.backend.service;

import com.soen390.backend.object.GoogleCalendarDto;
import com.soen390.backend.object.GoogleTokenSession;
import com.soen390.backend.object.GoogleEventDto;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GoogleCalendarService {

  private final RestTemplate restTemplate;
  private final GoogleSessionService sessionService;

  public GoogleCalendarService(RestTemplate restTemplate, GoogleSessionService sessionService) {
    this.restTemplate = restTemplate;
    this.sessionService = sessionService;
  }

  public List<GoogleCalendarDto> listCalendars(String sessionId) {
    GoogleTokenSession session = sessionService.require(sessionId);

    // MVP: if expired, force re-login (we’ll add refresh next step)
    if (session.getExpiresAt() != null && Instant.now().isAfter(session.getExpiresAt())) {
      throw new RuntimeException("Session expired. Please sign in again.");
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(session.getAccessToken());

    String url = "https://www.googleapis.com/calendar/v3/users/me/calendarList";

    ResponseEntity<Map> res = restTemplate.exchange(
        url,
        HttpMethod.GET,
        new HttpEntity<>(headers),
        Map.class
    );

    if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
      throw new RuntimeException("Failed to fetch calendar list from Google.");
    }

    Object itemsObj = res.getBody().get("items");
    if (!(itemsObj instanceof List<?> items)) return List.of();

    List<GoogleCalendarDto> out = new ArrayList<>();
    for (Object o : items) {
      if (!(o instanceof Map<?, ?> m)) continue;

      String id = (String) m.get("id");
      String summary = (String) m.get("summary");
      Boolean primary = (Boolean) m.get("primary");

      if (id != null) {
        out.add(new GoogleCalendarDto(
            id,
            summary != null ? summary : "(no name)",
            primary != null && primary
        ));
      }
    }

    return out;
  }


  public List<GoogleEventDto> importEvents(String sessionId, String calendarId, int days, String timeZone) {
      GoogleTokenSession session = sessionService.require(sessionId);

      Instant timeMin = Instant.now();
      Instant timeMax = timeMin.plusSeconds((long) days * 24 * 60 * 60);

      // IMPORTANT: don't manually URLEncode calendarId in the path; let Spring encode it correctly
      String url = UriComponentsBuilder
          .fromUriString("https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events")
          .queryParam("timeMin", timeMin.toString())
          .queryParam("timeMax", timeMax.toString())
          .queryParam("singleEvents", "true")
          .queryParam("orderBy", "startTime")
          .queryParam("maxResults", "250")
          .queryParam("timeZone", timeZone)
          .buildAndExpand(calendarId)
          .encode()
          .toUriString();

      HttpHeaders headers = new HttpHeaders();
      headers.setBearerAuth(session.getAccessToken());

      try {
        ResponseEntity<Map> res = restTemplate.exchange(
            url,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Map.class
        );

        Object itemsObj = (res.getBody() != null) ? res.getBody().get("items") : null;
        if (!(itemsObj instanceof List<?> items)) return List.of();

        List<GoogleEventDto> out = new ArrayList<>();

        for (Object o : items) {
          if (!(o instanceof Map<?, ?> ev)) continue;

          String id = (String) ev.get("id");
          String summary = (String) ev.get("summary");
          String location = (String) ev.get("location");

          Map<?, ?> start = (Map<?, ?>) ev.get("start");
          Map<?, ?> end = (Map<?, ?>) ev.get("end");

          String startDateTime = start != null ? (String) start.get("dateTime") : null;
          String endDateTime = end != null ? (String) end.get("dateTime") : null;

          String startDate = start != null ? (String) start.get("date") : null;
          String endDate = end != null ? (String) end.get("date") : null;

          boolean allDay = startDate != null && endDate != null;
          String startIso = allDay ? startDate : startDateTime;
          String endIso = allDay ? endDate : endDateTime;

          out.add(new GoogleEventDto(
              id,
              summary != null ? summary : "(no title)",
              location,
              startIso,
              endIso,
              allDay
          ));
        }

        return out;

      } catch (HttpStatusCodeException e) {
        // This is the key: expose what Google actually said
        throw new RuntimeException(
            "Google Events API error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(),
            e
        );
      }
    }

  public GoogleEventDto getNextEvent(String sessionId, String calendarId, int days, String timeZone) {
    List<GoogleEventDto> events = importEvents(sessionId, calendarId, days, timeZone);
    Instant now = Instant.now();

    for (GoogleEventDto event : events) {
      Instant eventStart = toEventStartInstant(event, timeZone);
      if (eventStart != null && eventStart.isAfter(now)) {
        return event;
      }
    }
    return null;
  }

  public void setSelectedCalendar(String sessionId, GoogleCalendarDto selectedCalendar) {
    GoogleTokenSession session = sessionService.require(sessionId);
    if (selectedCalendar == null || selectedCalendar.getId() == null || selectedCalendar.getId().isBlank()) {
      throw new RuntimeException("calendar.id is required.");
    }

    session.setSelectedCalendarId(selectedCalendar.getId());
    session.setSelectedCalendarSummary(
        selectedCalendar.getSummary() != null ? selectedCalendar.getSummary() : "(no name)"
    );
    session.setSelectedCalendarPrimary(selectedCalendar.isPrimary());
    sessionService.put(sessionId, session);
  }

  public Map<String, Object> getState(String sessionId, int days, String timeZone) {
    return getState(sessionId, days, timeZone, false);
  }

  public Map<String, Object> getState(String sessionId, int days, String timeZone, boolean includeCalendars) {
    GoogleTokenSession session = sessionService.require(sessionId);

    if (session.getExpiresAt() != null && Instant.now().isAfter(session.getExpiresAt())) {
      throw new RuntimeException("Session expired. Please sign in again.");
    }

    GoogleCalendarDto selectedCalendar = null;
    GoogleEventDto nextEvent = null;
    boolean calendarSelected = session.getSelectedCalendarId() != null && !session.getSelectedCalendarId().isBlank();

    if (calendarSelected) {
      selectedCalendar = new GoogleCalendarDto(
          session.getSelectedCalendarId(),
          session.getSelectedCalendarSummary() != null ? session.getSelectedCalendarSummary() : "(no name)",
          session.isSelectedCalendarPrimary()
      );
      nextEvent = getNextEvent(sessionId, selectedCalendar.getId(), days, timeZone);
    }

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("connected", true);
    out.put("calendarSelected", calendarSelected);
    out.put("selectedCalendar", selectedCalendar);
    out.put("nextEvent", nextEvent);
    if (includeCalendars) {
      List<GoogleCalendarDto> calendars = listCalendars(sessionId);
      out.put("calendars", calendars);
    }
    return out;
  }

  private Instant toEventStartInstant(GoogleEventDto event, String timeZone) {
    if (event == null || event.getStart() == null || event.getStart().isBlank()) {
      return null;
    }

    String start = event.getStart();

    if (event.isAllDay()) {
      try {
        ZoneId zone = ZoneId.of(timeZone);
        return LocalDate.parse(start).atStartOfDay(zone).toInstant();
      } catch (RuntimeException e) {
        return null;
      }
    }

    try {
      return OffsetDateTime.parse(start).toInstant();
    } catch (DateTimeParseException e) {
      try {
        return Instant.parse(start);
      } catch (DateTimeParseException ignored) {
        return null;
      }
    }
  }
}




