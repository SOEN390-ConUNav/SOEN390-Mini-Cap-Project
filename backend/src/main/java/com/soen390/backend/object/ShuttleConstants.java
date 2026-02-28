package com.soen390.backend.object;

import java.util.List;

public class ShuttleConstants {
    private ShuttleConstants() {
    }

    private static final String T_0915 = "09:15";
    private static final String T_0930 = "09:30";
    private static final String T_0945 = "09:45";
    private static final String T_1000 = "10:00";
    private static final String T_1015 = "10:15";
    private static final String T_1030 = "10:30";
    private static final String T_1045 = "10:45";
    private static final String T_1100 = "11:00";
    private static final String T_1115 = "11:15";
    private static final String T_1130 = "11:30";
    private static final String T_1145 = "11:45";
    private static final String T_1200 = "12:00";
    private static final String T_1215 = "12:15";
    private static final String T_1230 = "12:30";
    private static final String T_1245 = "12:45";
    private static final String T_1300 = "13:00";
    private static final String T_1315 = "13:15";
    private static final String T_1330 = "13:30";
    private static final String T_1345 = "13:45";
    private static final String T_1400 = "14:00";
    private static final String T_1415 = "14:15";
    private static final String T_1430 = "14:30";
    private static final String T_1445 = "14:45";
    private static final String T_1500 = "15:00";
    private static final String T_1515 = "15:15";
    private static final String T_1530 = "15:30";
    private static final String T_1545 = "15:45";
    private static final String T_1600 = "16:00";
    private static final String T_1615 = "16:15";
    private static final String T_1630 = "16:30";
    private static final String T_1645 = "16:45";
    private static final String T_1700 = "17:00";
    private static final String T_1715 = "17:15";
    private static final String T_1730 = "17:30";
    private static final String T_1745 = "17:45";
    private static final String T_1800 = "18:00";
    private static final String T_1815 = "18:15";
    private static final String T_1830 = "18:30";

    public static final List<String> SGW_WEEKDAY = List.of(
            T_0930, T_0945, T_1000, T_1015, T_1030, T_1045, T_1100, T_1115, T_1130,
            T_1215, T_1230, T_1245, T_1300, T_1315, T_1330, T_1345, T_1400, T_1415,
            T_1430, T_1445, T_1500, T_1515, T_1530, T_1600, T_1615, T_1645, T_1700,
            T_1715, T_1730, T_1745, T_1800, T_1815, T_1830
    );

    public static final List<String> LOY_WEEKDAY = List.of(
            T_0915, T_0930, T_0945, T_1000, T_1015, T_1030, T_1045, T_1100, T_1115,
            T_1130, T_1145, T_1230, T_1245, T_1300, T_1315, T_1330, T_1345, T_1400,
            T_1415, T_1430, T_1445, T_1500, T_1515, T_1530, T_1545, T_1630, T_1645,
            T_1700, T_1715, T_1730, T_1745, T_1800, T_1815, T_1830
    );

    public static final List<String> SGW_FRIDAY = List.of(
            T_0945, T_1000, T_1015, T_1045, T_1115, T_1130, T_1215, T_1230, T_1245,
            T_1315, T_1345, T_1400, T_1415, T_1445, T_1500, T_1515, T_1545, T_1600,
            T_1645, T_1715, T_1745, T_1815
    );

    public static final List<String> LOY_FRIDAY = List.of(
            T_0915, T_0930, T_0945, T_1015, T_1045, T_1100, T_1115, T_1200, T_1215,
            T_1245, T_1300, T_1315, T_1345, T_1415, T_1430, T_1445, T_1515, T_1530,
            T_1545, T_1645, T_1715, T_1745, T_1815
    );
}