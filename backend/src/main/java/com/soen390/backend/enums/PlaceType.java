package com.soen390.backend.enums;

import java.util.Locale;

public enum PlaceType {
    PARKING, LIBRARY, PARK, BANK, FOOD_STORE, GYM, SUBWAY_STATION, RESTAURANT;

    public static PlaceType fromQueryParam(String value) {
        return PlaceType.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
