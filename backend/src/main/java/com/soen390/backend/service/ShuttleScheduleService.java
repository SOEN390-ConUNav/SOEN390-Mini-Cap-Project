package com.soen390.backend.service;

import com.soen390.backend.object.ShuttleConstants;
import com.soen390.backend.object.ShuttleSchedule;
import com.soen390.backend.object.ShuttleScheduleResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShuttleScheduleService {

    private final List<ShuttleSchedule> schedules;
    private final long version;

    public ShuttleScheduleService() {
        this.version = 1L;
        this.schedules = buildSchedules();
    }

    public List<ShuttleSchedule> getSchedules() {
        return schedules;
    }

    public long getVersion() {
        return version;
    }

    public ShuttleScheduleResponse getScheduleResponse() {
        return new ShuttleScheduleResponse(schedules, version);
    }

    private static List<ShuttleSchedule> buildSchedules() {
        return List.of(
                new ShuttleSchedule("SGW", "weekday", ShuttleConstants.SGW_WEEKDAY),
                new ShuttleSchedule("LOY", "weekday", ShuttleConstants.LOY_WEEKDAY),
                new ShuttleSchedule("SGW", "friday", ShuttleConstants.SGW_FRIDAY),
                new ShuttleSchedule("LOY", "friday", ShuttleConstants.LOY_FRIDAY)
        );
    }
}
