package com.soen390.backend.enums;

public enum BuildingLocation {
    FB("SGW", "1250 Guy St, Montreal, Quebec H3H 2S7"),
    CL("SGW", "1665 Rue Sainte-Catherine O, Montreal, QC H3H 1L9"),
    H("SGW", "Concordia University, Henry F. Hall (H) Building, 1455 Blvd. De Maisonneuve Ouest, Montreal, Quebec H3G 1M8"),
    MB("SGW", "1450 Guy St, Montreal, QC"),
    LB("SGW", "LB Building, Concordia University, 1400 Blvd. De Maisonneuve Ouest, Montreal, Quebec H3G 2V8"),
    LS("SGW", "1535 Blvd. De Maisonneuve Ouest, Montreal, Quebec H3G 1M9"),
    ER("SGW", "2155 Guy St, Montreal, Quebec H3H 2L9"),
    EV("SGW", "Concordia Engineering And Visual Arts (EV) Building, 1515 Rue Sainte-Catherine O, Montreal, Quebec H3G 2H7"),
    VL("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_VE_VL_SC_ENTRANCE),
    CC("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_AD_CC_ENTRANCE),
    VE("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_VE_VL_SC_ENTRANCE),
    SC("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_VE_VL_SC_ENTRANCE),
    AD("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_AD_CC_ENTRANCE),
    SP("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_SP_ENTRANCE),
    HU("LOY", Constants.LOYOLA_ADDRESS, Constants.LOYOLA_HU_ENTRANCE),
    HB("LOY", Constants.HB_ADDRESS);

    public final String campus;
    public final String address;
    private final String directionsTarget;

    BuildingLocation(String campus, String address) {
        this(campus, address, address);
    }

    BuildingLocation(String campus, String address, String directionsTarget) {
        this.campus = campus;
        this.address = address;
        this.directionsTarget = directionsTarget;
    }

    public String getDirectionsTarget() {
        return directionsTarget;
    }

    public static BuildingLocation fromId(String id) {
        if (id == null) return H;
        if (id.startsWith("Hall")) return H;
        BuildingLocation bestMatch = null;
        for (BuildingLocation b : values()) {
            if (id.equals(b.name())) {
                return b;
            }
            if (id.startsWith(b.name())
                    && (bestMatch == null || b.name().length() > bestMatch.name().length())) {
                bestMatch = b;
            }
        }
        return bestMatch != null ? bestMatch : H;
    }

    private static class Constants {
        private static final String LOYOLA_ADDRESS = "7141 Sherbrooke St W, Montreal, QC";
        private static final String LOYOLA_VE_VL_SC_ENTRANCE = "45.458899,-73.639073";
        private static final String LOYOLA_AD_CC_ENTRANCE = "45.45793,-73.63957";
        private static final String LOYOLA_SP_ENTRANCE = "45.45778,-73.64104";
        private static final String LOYOLA_HU_ENTRANCE = "45.45839,-73.64151";
        private static final String HB_ADDRESS = "Hingston Hall B, Montreal, Quebec H4B, Canada";
    }
}
