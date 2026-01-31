package com.soen390.backend.dto;

import com.soen390.backend.enums.ManeuverType;

public record RouteStep(String instruction, String distance, String duration, ManeuverType maneuverType) {}
