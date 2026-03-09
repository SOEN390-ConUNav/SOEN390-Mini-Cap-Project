package com.soen390.backend.object;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class UniversalDirectionResponseTest {

    @Test
    void constructorAndGetters_workCorrectly() {
        IndoorDirectionResponse mockStartIndoor = mock(IndoorDirectionResponse.class);
        OutdoorDirectionResponse mockOutdoor = mock(OutdoorDirectionResponse.class);
        IndoorDirectionResponse mockEndIndoor = mock(IndoorDirectionResponse.class);
        String shuttleTime = "14:30";
        String duration = "Approx 15 mins + indoor walking time.";

        UniversalDirectionResponse response = new UniversalDirectionResponse(
                mockStartIndoor,
                mockOutdoor,
                mockEndIndoor,
                shuttleTime,
                duration
        );

        assertEquals(mockStartIndoor, response.getStartIndoorRoute());
        assertEquals(mockOutdoor, response.getOutdoorRoute());
        assertEquals(mockEndIndoor, response.getEndIndoorRoute());
        assertEquals(shuttleTime, response.getNextShuttleTime());
        assertEquals(duration, response.getTotalDuration());
    }
}