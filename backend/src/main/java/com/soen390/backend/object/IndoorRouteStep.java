package com.soen390.backend.object;

import com.soen390.backend.enums.IndoorManeuverType;

public record IndoorRouteStep(
    String instruction,
    String distance,
    String duration,
    IndoorManeuverType maneuverType,
    String floor,
    String roomNumber,
    String landmark
) {}
