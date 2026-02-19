package com.soen390.backend.enums;

public enum IndoorManeuverType {
    STRAIGHT("straight"),
    TURN_LEFT("turn-left"),
    TURN_RIGHT("turn-right"),
    TURN_AROUND("turn-around"),
    ELEVATOR_UP("elevator-up"),
    ELEVATOR_DOWN("elevator-down"),
    STAIRS_UP("stairs-up"),
    STAIRS_DOWN("stairs-down"),
    ESCALATOR_UP("escalator-up"),
    ESCALATOR_DOWN("escalator-down"),
    ENTER_ROOM("enter-room"),
    EXIT_ROOM("exit-room"),
    ENTER_BUILDING("enter-building"),
    EXIT_BUILDING("exit-building"),
    ENTER_FLOOR("enter-floor"),
    EXIT_FLOOR("exit-floor");

    private final String value;

    IndoorManeuverType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static IndoorManeuverType fromString(String text) {
        for (IndoorManeuverType maneuver : IndoorManeuverType.values()) {
            if (maneuver.value.equalsIgnoreCase(text)) {
                return maneuver;
            }
        }
        return STRAIGHT; 
    }
}
