package com.soen390.backend.enums;

public enum BuildingLocation {
    H("SGW", "1455 De Maisonneuve Blvd W, Montreal, QC"),
    MB("SGW", "1450 Guy St, Montreal, QC"),
    LB("SGW", "1400 De Maisonneuve Blvd W, Montreal, QC"),
    VL("LOY", "7141 Sherbrooke St W, Montreal, QC"),
    CC("LOY", "7141 Sherbrooke St W, Montreal, QC"), // Adjust address if specific CC address differs
    VE("LOY", "7141 Sherbrooke St W, Montreal, QC");

    public final String campus;
    public final String address;

    BuildingLocation(String campus, String address) {
        this.campus = campus;
        this.address = address;
    }

    public static BuildingLocation fromId(String id) {
        if (id == null) return H;
        if (id.startsWith("Hall") || id.equals("H")) return H;
        for (BuildingLocation b : values()) {
            if (id.startsWith(b.name())) return b;
        }
        return H;
    }
}