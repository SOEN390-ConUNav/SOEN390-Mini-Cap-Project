package com.soen390.backend.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TransportMode {
    WALKING("walking"),
    DRIVING("driving"),
    BICYCLING("bicycling"),
    TRANSIT("transit"),
    SHUTTLE("shuttle");

    private final String apiValue;

    TransportMode(String apiValue) {
        this.apiValue = apiValue;
    }

    @JsonValue
    public String getApiValue() {
        return apiValue;
    }
}
