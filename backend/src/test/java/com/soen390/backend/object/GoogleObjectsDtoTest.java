package com.soen390.backend.object;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class GoogleObjectsDtoTest {

    @Test
    void googleCalendarDtoDefaultConstructorAndSetters() {
        GoogleCalendarDto dto = new GoogleCalendarDto();

        dto.setId("cal-1");
        dto.setSummary("My Calendar");
        dto.setPrimary(true);

        assertEquals("cal-1", dto.getId());
        assertEquals("My Calendar", dto.getSummary());
        assertTrue(dto.isPrimary());
    }

    @Test
    void googleEventDtoDefaultConstructorAndSetters() {
        GoogleEventDto dto = new GoogleEventDto();

        dto.setId("event-1");
        dto.setSummary("SOEN 390");
        dto.setLocation("H-937");
        dto.setStart("2026-02-19T10:00:00-05:00");
        dto.setEnd("2026-02-19T11:15:00-05:00");
        dto.setAllDay(false);

        assertEquals("event-1", dto.getId());
        assertEquals("SOEN 390", dto.getSummary());
        assertEquals("H-937", dto.getLocation());
        assertEquals("2026-02-19T10:00:00-05:00", dto.getStart());
        assertEquals("2026-02-19T11:15:00-05:00", dto.getEnd());
        assertFalse(dto.isAllDay());
    }

    @Test
    void googleTokenSessionSetters() {
        Instant initialExpiry = Instant.now().plusSeconds(300);
        GoogleTokenSession session = new GoogleTokenSession("a1", "r1", initialExpiry);

        Instant newExpiry = Instant.now().plusSeconds(600);
        session.setAccessToken("a2");
        session.setRefreshToken("r2");
        session.setExpiresAt(newExpiry);
        session.setSelectedCalendarId("cal-2");
        session.setSelectedCalendarSummary("School");
        session.setSelectedCalendarPrimary(true);

        assertEquals("a2", session.getAccessToken());
        assertEquals("r2", session.getRefreshToken());
        assertEquals(newExpiry, session.getExpiresAt());
        assertEquals("cal-2", session.getSelectedCalendarId());
        assertEquals("School", session.getSelectedCalendarSummary());
        assertTrue(session.isSelectedCalendarPrimary());
    }
}
