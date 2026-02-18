package com.soen390.backend.object;

import java.util.List;

public class IndoorDirectionResponse {
    private String distance;
    private String duration;
    private BuildingInfo buildingInfo;
    private List<IndoorRouteStep> steps;
    private List<RoutePoint> routePoints; 
    private String stairMessage; // e.g. "You need to go up/down the stairs" or null

    public IndoorDirectionResponse(
            String distance,
            String duration,
            BuildingInfo buildingInfo,
            List<IndoorRouteStep> steps,
            List<RoutePoint> routePoints) {
        this.distance = distance;
        this.duration = duration;
        this.buildingInfo = buildingInfo;
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
        return buildingInfo.name();
    }

    public String getBuildingId() {
        return buildingInfo.id();
    }

    public String getStartFloor() {
        return buildingInfo.startFloor();
    }

    public String getEndFloor() {
        return buildingInfo.endFloor();
    }

    public List<IndoorRouteStep> getSteps() {
        return steps;
    }

    public List<RoutePoint> getRoutePoints() {
        return routePoints;
    }

    /**
     * Groups the four building-related fields that were previously separate constructor parameters.
     */
    public record BuildingInfo(String name, String id, String startFloor, String endFloor) {}

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
