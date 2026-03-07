package com.soen390.backend.object;

import java.util.List;

public class UniversalDirectionResponse {
    private IndoorDirectionResponse startIndoorRoute;
    private OutdoorDirectionResponse outdoorRoute;
    private IndoorDirectionResponse endIndoorRoute;
    private String nextShuttleTime;
    private String totalDuration;

    public UniversalDirectionResponse(IndoorDirectionResponse startIndoorRoute,
                                      OutdoorDirectionResponse outdoorRoute,
                                      IndoorDirectionResponse endIndoorRoute,
                                      String nextShuttleTime,
                                      String totalDuration) {
        this.startIndoorRoute = startIndoorRoute;
        this.outdoorRoute = outdoorRoute;
        this.endIndoorRoute = endIndoorRoute;
        this.nextShuttleTime = nextShuttleTime;
        this.totalDuration = totalDuration;
    }

    public IndoorDirectionResponse getStartIndoorRoute() { return startIndoorRoute; }
    public OutdoorDirectionResponse getOutdoorRoute() { return outdoorRoute; }
    public IndoorDirectionResponse getEndIndoorRoute() { return endIndoorRoute; }
    public String getNextShuttleTime() { return nextShuttleTime; }
    public String getTotalDuration() { return totalDuration; }
}