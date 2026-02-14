package com.soen390.backend.object;

import java.util.List;

public class IndoorDirectionResponse {
    private String distance;
    private String duration;
    private String buildingName;
    private String buildingId;
    private String startFloor;
    private String endFloor;
    private List<IndoorRouteStep> steps;
    private List<RoutePoint> routePoints; 
    private String stairMessage; // e.g. "You need to go up/down the stairs" or null

    public IndoorDirectionResponse(
            String distance,
            String duration,
            String buildingName,
            String buildingId,
            String startFloor,
            String endFloor,
            List<IndoorRouteStep> steps,
            List<RoutePoint> routePoints) {
        this.distance = distance;
        this.duration = duration;
        this.buildingName = buildingName;
        this.buildingId = buildingId;
        this.startFloor = startFloor;
        this.endFloor = endFloor;
        this.steps = steps;
        this.routePoints = routePoints;
    }

    public String getStairMessage() {
        return stairMessage;
    }

    public void setStairMessage(String stairMessage) {
        this.stairMessage = stairMessage;
    }

    public String getDistance() {
        return distance;
    }

    public String getDuration() {
        return duration;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public String getBuildingId() {
        return buildingId;
    }

    public String getStartFloor() {
        return startFloor;
    }

    public String getEndFloor() {
        return endFloor;
    }

    public List<IndoorRouteStep> getSteps() {
        return steps;
    }

    public List<RoutePoint> getRoutePoints() {
        return routePoints;
    }

    public static class RoutePoint {
        private double x;
        private double y;
        private String label;

        public RoutePoint(double x, double y) {
            this(x, y, null);
        }

        public RoutePoint(double x, double y, String label) {
            this.x = x;
            this.y = y;
            this.label = label;
        }

        public double getX() {
            return x;
        }

        public double getY() {
            return y;
        }

        public String getLabel() {
            return label;
        }
    }
}
