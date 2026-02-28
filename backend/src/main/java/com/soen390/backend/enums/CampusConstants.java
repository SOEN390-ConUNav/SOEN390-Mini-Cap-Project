package com.soen390.backend.object;

public enum CampusConstants {
    SGW(45.49733989962878, -73.57903014967104, "SGW"),
    LOYOLA(45.45879485505858, -73.63867369960231, "LOYOLA");

    private final double latitude;
    private final double longitude;
    private final String stopName;

    CampusConstants(double latitude, double longitude, String stopName) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.stopName = stopName;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public String getStopName() {
        return stopName;
    }
}