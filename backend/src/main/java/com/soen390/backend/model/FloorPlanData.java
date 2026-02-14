package com.soen390.backend.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Data model for floor plan room/POI coordinates.
 */
public class FloorPlanData {
    
    private Map<String, Point> roomPoints;
    private Map<String, java.util.List<String>> roomEntranceGroups;
    private String buildingId;
    private String floor;
    
    public FloorPlanData(String buildingId, String floor) {
        this.buildingId = buildingId;
        this.floor = floor;
        this.roomPoints = new HashMap<>();
        this.roomEntranceGroups = new HashMap<>();
        
        if ("Hall-8".equals(buildingId) && "8".equals(floor)) {
        initializeHall8Data();
        } else if ("Hall-9".equals(buildingId) && "9".equals(floor)) {
            initializeHall9Data();
        } else if ("VL-1".equals(buildingId) && "1".equals(floor)) {
            initializeVL1Data();
        } else if ("VL-2".equals(buildingId) && "2".equals(floor)) {
            initializeVL2Data();
        } else if ("LB-2".equals(buildingId) && "2".equals(floor)) {
            initializeLB2Data();
        } else if ("LB-3".equals(buildingId) && "3".equals(floor)) {
            initializeLB3Data();
        } else if ("LB-4".equals(buildingId) && "4".equals(floor)) {
            initializeLB4Data();
        } else if ("LB-5".equals(buildingId) && "5".equals(floor)) {
            initializeLB5Data();
        } else if ("Hall-2".equals(buildingId) && "2".equals(floor)) {
            initializeHall2Data();
        } else if ("MB-S2".equals(buildingId) && "S2".equals(floor)) {
            initializeMBS2Data();
        } else if ("Hall-1".equals(buildingId) && "1".equals(floor)) {
            initializeHall1Data();
        }

        buildRoomEntranceGroups();
    }

    private void initializeHall8Data() {
        roomPoints.put("H8-843", new Point(373.69696, 914.06010));
        roomPoints.put("H8-845", new Point(287.59183, 921.88782));
        roomPoints.put("H8-847", new Point(196.59441, 915.03854));
        roomPoints.put("H8-849", new Point(124.18784, 904.27539));
        roomPoints.put("H8-851.03", new Point(56.67363, 851.43820));
        roomPoints.put("H8-851.02", new Point(89.94150, 809.36414));
        roomPoints.put("H8-851.01", new Point(131.03712, 824.04115));
        roomPoints.put("H8-853", new Point(126.14478, 736.95764));
        roomPoints.put("H8-855", new Point(125.16632, 644.98163));
        roomPoints.put("H8-857", new Point(123.20939, 554.96268));
        roomPoints.put("H8-859", new Point(123.20939, 463.96529));
        roomPoints.put("H8-861", new Point(125.16632, 374.92479));
        roomPoints.put("H8-863", new Point(127.12325, 294.69050));
        roomPoints.put("H8-865", new Point(108.53238, 221.30546));
        roomPoints.put("H8-867", new Point(125.16632, 172.38208));
        roomPoints.put("H8-801", new Point(203.44368, 209.56387));
        roomPoints.put("H8-803", new Point(295.41959, 203.69303));
        roomPoints.put("H8-805.01", new Point(353.14911, 137.15729));
        roomPoints.put("H8-805.02", new Point(374.67541, 175.31750));
        roomPoints.put("H8-807", new Point(472.52211, 208.58538));
        roomPoints.put("H8-811", new Point(643.83130, 161.44705));
        roomPoints.put("H8-813", new Point(725.04407, 157.53319));
        roomPoints.put("H8-805.03", new Point(375.76791, 220.21151));
        roomPoints.put("H8-815", new Point(804.66827, 213.16987));
        roomPoints.put("H8-817", new Point(881.48627, 222.77212));
        roomPoints.put("H8-819", new Point(882.76654, 309.19236));
        roomPoints.put("H8-821", new Point(878.28552, 399.45347));
        roomPoints.put("H8-823", new Point(881.48627, 481.39265));
        roomPoints.put("H8-825", new Point(881.48627, 569.09315));
        roomPoints.put("H8-827", new Point(880.84607, 661.27473));
        roomPoints.put("H8-829", new Point(878.92566, 764.33888));
        roomPoints.put("H8-831", new Point(907.73236, 868.04310));
        roomPoints.put("H8-833", new Point(819.39172, 896.20973));
        roomPoints.put("H8-835", new Point(720.16852, 900.05061));
        roomPoints.put("H8-837", new Point(624.78619, 898.77028));
        roomPoints.put("H8-841", new Point(452.58591, 917.33467));
        roomPoints.put("H8-806.01", new Point(478.57504, 333.60866));
        roomPoints.put("H8-806.02", new Point(472.07016, 365.20390));
        roomPoints.put("H8-806.03", new Point(472.99942, 402.37477));
        roomPoints.put("H8-802-Bathroom", new Point(324.31592, 308.51829));
        roomPoints.put("H8-Elevator", new Point(364.27460, 404.23332));
        roomPoints.put("H8-892", new Point(423.74802, 411.66749));
        roomPoints.put("H8-898-emergency-exit", new Point(241.61070, 409.80894));
        roomPoints.put("H8-838", new Point(484.15070, 804.74952));
        roomPoints.put("H8-838.01", new Point(479.50433, 744.34681));
        roomPoints.put("H8-840", new Point(427.46509, 496.23121));
        roomPoints.put("H8-862", new Point(361.48679, 492.51411));
        roomPoints.put("H8-860.04", new Point(290.86212, 492.51411));
        roomPoints.put("H8-860.01", new Point(221.16672, 494.37269));
        roomPoints.put("H8-860.03", new Point(221.16672, 541.76558));
        roomPoints.put("H8-860.05", new Point(209.08618, 591.94624));
        roomPoints.put("H8-854", new Point(211.87401, 655.13673));
        roomPoints.put("H8-852", new Point(210.94473, 705.31740));
        roomPoints.put("H8-881", new Point(348.47699, 809.39589));
        roomPoints.put("H8-842", new Point(390.29422, 710.89308));
        roomPoints.put("H8-832.01", new Point(599.38043, 803.82026));
        roomPoints.put("H8-832.03", new Point(599.38043, 771.29573));
        roomPoints.put("H8-832.05", new Point(594.73407, 725.76143));
        roomPoints.put("H8-832.06", new Point(597.52185, 636.55128));
        roomPoints.put("H8-810-bathroom", new Point(613.31946, 305.73048));
        roomPoints.put("H8-890-emergency-exit", new Point(695.09540, 307.58903));
        roomPoints.put("H8-875-emergency-exit", new Point(309.14639, 804.02986));
        roomPoints.put("H8-885-emergency-exit", new Point(723.93853, 806.21138));
        roomPoints.put("H8-886", new Point(788.02258, 410.73820));
    }

    private void initializeHall9Data() {
        roomPoints.put("H9-967", new Point(130.55607, 238.08203));
        roomPoints.put("H9-903", new Point(160.60575, 148.84352));
        roomPoints.put("H9-905", new Point(339.08265, 183.44624));
        roomPoints.put("H9-907", new Point(430.14236, 187.08862));
        roomPoints.put("H9-909", new Point(559.44701, 168.87669));
        roomPoints.put("H9-911", new Point(645.95374, 173.42965));
        roomPoints.put("H9-913", new Point(736.10277, 170.69789));
        roomPoints.put("H9-915", new Point(851.74852, 150.66477));
        roomPoints.put("H9-917", new Point(881.79820, 179.80386));
        roomPoints.put("H9-919", new Point(880.88761, 261.75753));
        roomPoints.put("H9-921", new Point(887.26177, 347.35360));
        roomPoints.put("H9-923", new Point(886.35118, 431.12848));
        roomPoints.put("H9-925.02", new Point(939.16575, 495.78085));
        roomPoints.put("H9-925", new Point(879.97703, 524.00934));
        roomPoints.put("H9-925.03", new Point(880.88761, 587.75111));
        roomPoints.put("H9-927.04", new Point(841.73197, 668.79420));
        roomPoints.put("H9-929", new Point(846.28495, 717.05581));
        roomPoints.put("H9-931", new Point(831.71538, 872.76785));
        roomPoints.put("H9-933-a", new Point(781.63255, 862.75131));
        roomPoints.put("H9-961.33-a", new Point(338.17210, 918.29770));
        roomPoints.put("H9-961.31-a", new Point(293.55289, 917.38705));
        roomPoints.put("H9-961.29", new Point(248.93361, 917.38705));
        roomPoints.put("H9-961.27", new Point(209.77797, 919.20827));
        roomPoints.put("H9-961.25", new Point(169.71171, 918.29770));
        roomPoints.put("H9-961.23", new Point(125.09250, 917.38705));
        roomPoints.put("H9-961.21", new Point(78.65206, 921.02944));
        roomPoints.put("H9-961.19", new Point(48.60239, 903.72812));
        roomPoints.put("H9-961.17", new Point(51.33416, 862.75131));
        roomPoints.put("H9-961.15", new Point(52.24478, 821.77443));
        roomPoints.put("H9-961.13", new Point(46.78121, 775.33400));
        roomPoints.put("H9-961.11", new Point(50.42361, 735.26777));
        roomPoints.put("H9-961.09-a", new Point(51.33416, 693.38034));
        roomPoints.put("H9-961.07", new Point(48.60239, 643.29750));
        roomPoints.put("H9-961.03", new Point(50.42361, 595.94648));
        roomPoints.put("H9-961", new Point(46.78121, 513.99281));
        roomPoints.put("H9-961.31-b", new Point(173.35411, 450.25103));
        roomPoints.put("H9-961.33-b", new Point(132.37730, 333.69468));
        roomPoints.put("H9-920", new Point(757.95707, 407.45296));
        roomPoints.put("H9-990", new Point(715.15906, 266.31049));
        roomPoints.put("H9-927.03", new Point(952.98019, 616.82124));
        roomPoints.put("H9-927.01", new Point(963.98178, 649.33699));
        roomPoints.put("H9-928", new Point(786.73428, 819.98356));
        roomPoints.put("H9-962-a", new Point(744.92833, 822.18386));
        roomPoints.put("H9-933-b", new Point(791.56863, 870.95322));
        roomPoints.put("H9-933.11", new Point(689.99064, 856.44205));
        roomPoints.put("H9-933.01", new Point(681.17013, 890.30143));
        roomPoints.put("H9-933.02", new Point(646.45718, 918.47012));
        roomPoints.put("H9-941", new Point(385.06267, 919.14963));
        roomPoints.put("H9-929.25", new Point(499.48128, 939.35294));
        roomPoints.put("H9-937", new Point(630.50261, 780.72707));
        roomPoints.put("H9-943", new Point(369.06006, 873.94229));
        roomPoints.put("H9-961.3", new Point(268.44369, 879.14310));
        roomPoints.put("H9-961.09-b", new Point(225.63671, 880.14328));
        roomPoints.put("H9-961.09-c", new Point(178.82910, 877.74289));
        roomPoints.put("H9-961.14", new Point(103.81687, 789.32853));
        roomPoints.put("H9-961.12", new Point(100.41637, 731.91915));
        roomPoints.put("H9-961.10", new Point(100.61640, 703.51455));
        roomPoints.put("H9-961.09-d", new Point(160.61760, 688.77247));
        roomPoints.put("H9-981.09", new Point(381.35244, 758.61544));
        roomPoints.put("H9-945", new Point(333.98164, 803.60074));
        roomPoints.put("H9-966.02", new Point(457.00956, 591.96542));
        roomPoints.put("H9-966.01", new Point(453.26075, 636.26906));
        roomPoints.put("H9-966", new Point(380.33005, 642.06263));
        roomPoints.put("H9-968", new Point(219.47363, 643.08505));
        roomPoints.put("H9-962.01", new Point(450.19357, 544.93531));
        roomPoints.put("H9-960", new Point(445.76322, 483.25098));
        roomPoints.put("H9-962-b", new Point(376.24049, 450.19361));
        roomPoints.put("H9-964", new Point(299.22025, 438.94730));
        roomPoints.put("H9-992", new Point(430.42730, 377.26291));
        roomPoints.put("H9-998", new Point(286.61077, 372.49178));
        roomPoints.put("Bathroom-Men", new Point(642.31134, 262.66810));
        roomPoints.put("Bathroom-Women", new Point(349.65829, 267.86686));
        roomPoints.put("Elevator", new Point(362.26783, 369.42458));
        roomPoints.put("Emergency-Exit-985", new Point(717.05772, 679.65243));
        roomPoints.put("Emergency-Exit-975", new Point(304.39802, 695.86185));
    }

    private void initializeVL1Data() {
        roomPoints.put("VL-101", new Point(363.95337, 118.26192));
        roomPoints.put("VL-102", new Point(410.70807, 79.758041));
        roomPoints.put("VL-103", new Point(454.71252, 82.508316));
        roomPoints.put("VL-104", new Point(483.13205, 83.425079));
        roomPoints.put("VL-105", new Point(496.88342, 116.42841));
        roomPoints.put("VL-106", new Point(558.30627, 121.92896));
        roomPoints.put("VL-107", new Point(606.89453, 122.84572));
        roomPoints.put("VL-108", new Point(762.74359, 121.0122));
        roomPoints.put("VL-109", new Point(649.06543, 174.18423));
        roomPoints.put("VL-110", new Point(648.14868, 209.02107));
        roomPoints.put("VL-111", new Point(651.81573, 317.19864));
        roomPoints.put("VL-112", new Point(721.48944, 319.03217));
        roomPoints.put("VL-113", new Point(719.65588, 204.43729));
        roomPoints.put("VL-114", new Point(764.57709, 344.70142));
        roomPoints.put("VL-115", new Point(750.82568, 387.78909));
        roomPoints.put("VL-116", new Point(748.99219, 440.96112));
        roomPoints.put("VL-117", new Point(763.66034, 680.23523));
        roomPoints.put("VL-118", new Point(801.24744, 603.22748));
        roomPoints.put("VL-119", new Point(837.91785, 720.57263));
        roomPoints.put("VL-120", new Point(803.99774, 744.40839));
        roomPoints.put("VL-121", new Point(770.07764, 759.99329));
        roomPoints.put("VL-122", new Point(660.98334, 679.31848));
        roomPoints.put("VL-123", new Point(614.22858, 675.65149));
        roomPoints.put("VL-124", new Point(605.97778, 748.99219));
        roomPoints.put("VL-125", new Point(305.28079, 853.50275));
        roomPoints.put("VL-126", new Point(307.11429, 914.9256));
        roomPoints.put("VL-127", new Point(85.258598, 940.59485));
        roomPoints.put("VL-128", new Point(72.423973, 838.83459));
        roomPoints.put("VL-129", new Point(74.257484, 796.66364));
        roomPoints.put("VL-130", new Point(72.423973, 748.99219));
        roomPoints.put("VL-131", new Point(73.340729, 705.90454));
        roomPoints.put("VL-132", new Point(77.007767, 664.65033));
        roomPoints.put("VL-133", new Point(170.5172, 615.14539));
        roomPoints.put("VL-134", new Point(225.52274, 614.22858));
        roomPoints.put("VL-135", new Point(227.35626, 488.6326));
        roomPoints.put("VL-136", new Point(275.94449, 443.7114));
        roomPoints.put("VL-137", new Point(446.4617, 448.2952));
        roomPoints.put("VL-138", new Point(370.37067, 319.03217));
        roomPoints.put("VL-139", new Point(512.46832, 316.28189));
        roomPoints.put("VL-140", new Point(567.47388, 189.76913));
    }

    private void initializeVL2Data() {
        roomPoints.put("VL-201", new Point(271.19589, 446.99088));
        roomPoints.put("VL-202", new Point(231.53484, 488.79578));
        roomPoints.put("VL-203", new Point(572.40558, 310.85696));
        roomPoints.put("VL-204", new Point(657.08728, 315.14465));
        roomPoints.put("VL-205", new Point(649.58386, 211.16835));
        roomPoints.put("VL-206", new Point(807.15619, 315.14465));
        roomPoints.put("VL-207", new Point(233.67868, 529.52875));
        roomPoints.put("VL-208", new Point(654.94342, 369.81259));
        roomPoints.put("VL-209", new Point(654.94342, 436.27167));
        roomPoints.put("VL-210", new Point(656.01538, 485.58002));
        roomPoints.put("VL-211", new Point(732.1217, 375.17218));
        roomPoints.put("VL-212", new Point(70.746758, 838.24188));
        roomPoints.put("VL-213", new Point(79.322121, 947.57776));
        roomPoints.put("VL-214", new Point(778.21429, 737.48132));
        roomPoints.put("VL-215", new Point(756.77588, 783.57391));
        roomPoints.put("VL-216", new Point(802.86847, 687.10107));
        roomPoints.put("VL-217", new Point(798.58081, 717.11487));
    }

    /**
     * Groups rooms with multiple entrances (e.g. LB-261-1, LB-261-2 → LB-261)
     */
    private void buildRoomEntranceGroups() {
        for (String roomId : roomPoints.keySet()) {
            int lastDashIndex = roomId.lastIndexOf('-');
            if (lastDashIndex > 0) {
                String baseRoomId = roomId.substring(0, lastDashIndex);
                if (!baseRoomId.contains("-")) continue;
                String possibleSuffix = roomId.substring(lastDashIndex + 1);
                try {
                    Integer.parseInt(possibleSuffix);
                    roomEntranceGroups.computeIfAbsent(baseRoomId, k -> new java.util.ArrayList<>()).add(roomId);
                } catch (NumberFormatException e) {
                    // Not a numeric suffix — skip
                }
            }
        }

        for (String baseRoomId : new java.util.ArrayList<>(roomEntranceGroups.keySet())) {
            if (roomPoints.containsKey(baseRoomId)) {
                roomEntranceGroups.get(baseRoomId).add(0, baseRoomId);
            }
        }
    }

    public String getBaseRoomId(String roomId) {
        for (Map.Entry<String, java.util.List<String>> entry : roomEntranceGroups.entrySet()) {
            if (entry.getValue().contains(roomId)) {
                return entry.getKey();
            }
        }
        return roomId;
    }

    public java.util.Set<String> getBaseRoomIds() {
        java.util.Set<String> baseRoomIds = new java.util.HashSet<>();
        for (String roomId : roomPoints.keySet()) {
            baseRoomIds.add(getBaseRoomId(roomId));
        }
        return baseRoomIds;
    }

    /**
     * Resolve a base room ID to the closest entrance relative to a reference point.
     */
    public String resolveToClosestEntrance(String baseRoomId, double referenceX, double referenceY) {
        java.util.List<String> entrances = roomEntranceGroups.get(baseRoomId);
        if (entrances == null || entrances.isEmpty()) {
            return baseRoomId;
        }
        String closestEntrance = baseRoomId;
        double minDistance = Double.MAX_VALUE;
        Point referencePoint = new Point(referenceX, referenceY);

        for (String entranceId : entrances) {
            Point entrancePoint = roomPoints.get(entranceId);
            if (entrancePoint != null) {
                double distance = referencePoint.distanceTo(entrancePoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEntrance = entranceId;
                }
            }
        }
        return closestEntrance;
    }
    
    public Map<String, Point> getRoomPoints() {
        return roomPoints;
    }
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public String getFloor() {
        return floor;
    }

    public Map<String, java.util.List<String>> getRoomEntranceGroups() {
        return roomEntranceGroups;
    }

    private void initializeHall2Data() {
        roomPoints.put("H2-217", new Point(823.01392, 603.91809));
        roomPoints.put("H2-222", new Point(997.16705, 607.66327));
        roomPoints.put("H2-280-281", new Point(1093.6067, 612.34485));
        roomPoints.put("H2-275", new Point(1133.8679, 549.61224));
        roomPoints.put("H2-260", new Point(1074.8805, 822.07764));
        roomPoints.put("H2-220-97", new Point(426.95602, 564.59314));
        roomPoints.put("H2-231", new Point(128.27406, 411.03882));
        roomPoints.put("H2-223.04", new Point(360.47821, 416.65665));
        roomPoints.put("H2-231.06", new Point(45.879047, 333.32532));
        roomPoints.put("H2-235", new Point(274.33798, 296.80936));
        roomPoints.put("H2-231.31", new Point(419.46558, 377.33176));
        roomPoints.put("H2-239s", new Point(651.66974, 311.79025));
        roomPoints.put("H2-209", new Point(69.28672, 803.35144));
        roomPoints.put("H2-205", new Point(111.42054, 817.39606));
        roomPoints.put("H2-290.1", new Point(102.05747, 751.85455));
        roomPoints.put("H2-224", new Point(543.05811, 769.64441));
        roomPoints.put("H2-224-1", new Point(548.67596, 879.19232));
        roomPoints.put("Maisonneuve-Entrance", new Point(429.76495, 1264.0145));
        roomPoints.put("Bishop-Entrance", new Point(1099.2245, 1196.6005));
        roomPoints.put("McKay-Exit", new Point(39.324898, 625.45312));
        roomPoints.put("Elevator-1", new Point(823.01392, 989.67657));
        roomPoints.put("Emergency-Stairs", new Point(1050.5365, 973.75934));
        roomPoints.put("Stairs-Up-1", new Point(664.77802, 691.93091));
        roomPoints.put("Stairs-Down-1", new Point(632.9436, 948.47906));
        roomPoints.put("Stairs-Underground", new Point(1071.1353, 1087.0525));
        roomPoints.put("Tabling-Area", new Point(782.75269, 853.91205));
        roomPoints.put("Stand", new Point(809.90564, 682.56787));
        roomPoints.put("Sitting-Area", new Point(955.0332, 793.9884));
        roomPoints.put("Couch-Area", new Point(1094.543, 687.24939));
        roomPoints.put("Bathroom-1", new Point(386.69482, 480.32553));
        roomPoints.put("Bathroom-2", new Point(437.2554, 474.70767));
        roomPoints.put("Bathroom-3", new Point(551.48486, 387.63113));
    }

    private void initializeLB2Data() {
        roomPoints.put("LB-204", new Point(276.96338, 272.18817));
        roomPoints.put("LB-213", new Point(177.87735, 293.0798));
        roomPoints.put("LB-207", new Point(101.47366, 149.22597));
        roomPoints.put("LB-285-1", new Point(615.4079, 209.51326));
        roomPoints.put("LB-285-2", new Point(866.70441, 216.6761));
        roomPoints.put("LB-259", new Point(627.34595, 306.80859));
        roomPoints.put("LB-257", new Point(631.52429, 356.35159));
        roomPoints.put("LB-251", new Point(627.94287, 666.74164));
        roomPoints.put("LB-261-1", new Point(969.37189, 624.95831));
        roomPoints.put("LB-261-2", new Point(949.07715, 386.19681));
        roomPoints.put("LB-245-1", new Point(615.4079, 811.78925));
        roomPoints.put("LB-245-2", new Point(867.30133, 826.11493));
        roomPoints.put("LB-231-231.25", new Point(228.61418, 629.13666));
        roomPoints.put("LB-204-2", new Point(735.38556, 500.20544));
        roomPoints.put("Bathroom-Men-1", new Point(244.73058, 318.14975));
        roomPoints.put("Bathroom-Men-2", new Point(893.56506, 270.39746));
        roomPoints.put("Bathroom-Women-1", new Point(244.73058, 395.74725));
        roomPoints.put("Bathroom-Women-2", new Point(879.23938, 757.47101));
        roomPoints.put("Elevator-1", new Point(334.26617, 422.01102));
        roomPoints.put("Elevator-2", new Point(383.80917, 650.02832));
        roomPoints.put("Stairs-Down-1", new Point(174.80748, 500.772));
        roomPoints.put("Stairs-Up-1", new Point(176.86403, 528.53552));
        roomPoints.put("Emergency-Exit-1", new Point(201.1566, 393.35965));
        roomPoints.put("Emergency-Exit-2", new Point(910.87531, 684.05182));
        roomPoints.put("Emergency-Exit-3", new Point(904.90625, 339.63831));
        roomPoints.put("Emergency-Exit-4", new Point(365.90207, 987.27899));
        roomPoints.put("Emergency-Exit-5", new Point(198.76898, 609.43884));
        roomPoints.put("Bookshelves-1", new Point(452.45312, 728.22272));
        roomPoints.put("Bookshelves-2", new Point(397.53796, 717.47845));
        roomPoints.put("Bookshelves-3", new Point(313.97144, 840.44061));
        roomPoints.put("Bookshelves-4", new Point(462.00357, 905.50317));
        roomPoints.put("Bookshelves-5", new Point(602.87292, 749.11432));
        roomPoints.put("Bookshelves-6", new Point(718.07532, 735.98248));
        roomPoints.put("Bookshelves-7", new Point(747.92053, 654.80353));
        roomPoints.put("Bookshelves-8", new Point(713.89703, 385.00299));
        roomPoints.put("Bookshelves-9", new Point(710.91248, 291.88599));
    }

    private void initializeLB3Data() {
        roomPoints.put("LB-385-1", new Point(655.44318, 233.11041));
        roomPoints.put("LB-385-2", new Point(906.54053, 227.3546));
        roomPoints.put("LB-362-1", new Point(945.39221, 441.75864));
        roomPoints.put("LB-362-2", new Point(945.39221, 618.74988));
        roomPoints.put("LB-361-1", new Point(1027.4126, 451.11182));
        roomPoints.put("LB-361-2", new Point(1016.6204, 607.23822));
        roomPoints.put("LB-345-1", new Point(910.85736, 859.05505));
        roomPoints.put("LB-345-2", new Point(652.56525, 836.0318));
        roomPoints.put("LB-351", new Point(642.49261, 730.26874));
        roomPoints.put("LB-353", new Point(652.56525, 612.2746));
        roomPoints.put("LB-359", new Point(651.84576, 313.6918));
        roomPoints.put("LB-322", new Point(289.94907, 597.88507));
        roomPoints.put("LB-327", new Point(245.34152, 738.18298));
        roomPoints.put("LB-311", new Point(241.74414, 315.85022));
        roomPoints.put("LB-314", new Point(356.1409, 465.50134));
        roomPoints.put("LB-316", new Point(169.077, 318.72812));
        roomPoints.put("LB-331-331.19-1", new Point(335.99557, 906.54053));
        roomPoints.put("LB-331-331.19-2", new Point(230.95198, 992.87769));
        roomPoints.put("Bathroom-Men-1", new Point(925.96637, 274.12057));
        roomPoints.put("Bathroom-Men-2", new Point(314.41129, 669.11322));
        roomPoints.put("Bathroom-Women-1", new Point(937.47803, 782.79053));
        roomPoints.put("Bathroom-Women-2", new Point(313.6918, 708.68445));
        roomPoints.put("Elevator-1", new Point(419.45486, 690.69751));
        roomPoints.put("Stairs-Down-1", new Point(580.61761, 232.39095));
        roomPoints.put("Stairs-Up-1", new Point(555.43591, 231.67146));
        roomPoints.put("Stairs-Down-2", new Point(584.215, 833.15387));
        roomPoints.put("Stairs-Up-2", new Point(553.99697, 833.87335));
        roomPoints.put("Emergency-Exit-1", new Point(925.96637, 700.7702));
        roomPoints.put("Emergency-Exit-2", new Point(246.78047, 639.61469));
        roomPoints.put("Emergency-Exit-3", new Point(364.77463, 998.63348));
        roomPoints.put("WaterFountain-1", new Point(919.49109, 252.53629));
        roomPoints.put("WaterFountain-2", new Point(920.93005, 741.06091));
        roomPoints.put("WaterFountain-3", new Point(293.54645, 694.29492));
        roomPoints.put("Computer-Station-1", new Point(479.17142, 855.45764));
        roomPoints.put("Study-Area-1", new Point(106.48254, 679.9054));
        roomPoints.put("Study-Area-2", new Point(430.96649, 84.898239));
        roomPoints.put("Printer-1", new Point(482.7688, 206.48978));
        roomPoints.put("Shelve-12", new Point(189.94182, 178.43019));
        roomPoints.put("Shelve-13", new Point(315.13074, 190.6613));
        roomPoints.put("Shelve-14", new Point(395.71213, 186.34444));
        roomPoints.put("Shelve-16", new Point(323.04498, 121.59155));
        roomPoints.put("Shelve-17", new Point(420.17432, 353.98248));
        roomPoints.put("Shelve-18", new Point(423.05225, 1020.9373));
        roomPoints.put("Shelve-19", new Point(776.31525, 343.90982));
    }

    private void initializeMBS2Data() {
        roomPoints.put("MB-S2-Room1", new Point(465.38757, 194.51746));
        roomPoints.put("MB-S2-Room2", new Point(579.9165, 192.69954));
        roomPoints.put("MB-S2-Room3", new Point(580.8255, 252.6909));
        roomPoints.put("MB-S2-Room4", new Point(642.63477, 152.70529));
        roomPoints.put("MB-S2-Room5", new Point(683.53796, 153.61426));
        roomPoints.put("MB-S2-Room6", new Point(723.53223, 264.50739));
        roomPoints.put("MB-S2-Room7", new Point(721.71429, 149.06946));
        roomPoints.put("MB-S2-Room8", new Point(750.80103, 218.15042));
        roomPoints.put("MB-S2-Room9", new Point(542.64917, 663.54083));
        roomPoints.put("MB-S2-Room10", new Point(677.17523, 568.10004));
        roomPoints.put("MB-S2-Room11", new Point(620.81976, 567.1911));
        roomPoints.put("MB-S2-Room13", new Point(723.53223, 570.8269));
        roomPoints.put("MB-S2-Room14", new Point(757.16376, 557.1925));
        roomPoints.put("MB-S2-Room15", new Point(634.45416, 638.99896));
        roomPoints.put("MB-S2-Room16", new Point(678.99316, 637.18103));
        roomPoints.put("MB-S2-Room17", new Point(718.98743, 638.99896));
        roomPoints.put("MB-S2-Room18", new Point(815.33722, 632.63623));
        roomPoints.put("MB-S2-Room19", new Point(627.18243, 699.89929));
        roomPoints.put("MB-S2-Room20", new Point(552.64771, 708.0799));
        roomPoints.put("MB-S2-Room21", new Point(554.46564, 791.70422));
        roomPoints.put("MB-S2-Room22", new Point(629.00037, 793.52216));
        roomPoints.put("MB-S2-Room23", new Point(600.82263, 932.59302));
        roomPoints.put("MB-S2-Room24", new Point(677.17523, 878.96442));
        roomPoints.put("MB-S2-Room25", new Point(722.62329, 807.15656));
        roomPoints.put("MB-S2-Room26", new Point(753.52789, 774.43396));
        roomPoints.put("MB-S2-Room27", new Point(759.89062, 872.60168));
        roomPoints.put("MB-S2-Room28", new Point(814.42822, 808.06549));
        roomPoints.put("MB-S2-Room29", new Point(895.32568, 903.50635));
        roomPoints.put("MB-S2-Room30", new Point(876.23755, 933.50201));
        roomPoints.put("MB-S2-Room31", new Point(922.59448, 842.60602));
        roomPoints.put("MB-S2-Room32", new Point(888.05402, 757.16376));
        roomPoints.put("Entrance-Exit", new Point(52.719685, 506.29077));
    }

    private void initializeLB4Data() {
        roomPoints.put("LB-485-1", new Point(655.30969, 214.79161));
        roomPoints.put("LB-485-2", new Point(910.71643, 217.1348));
        roomPoints.put("LB-461-1", new Point(1016.1596, 426.45898));
        roomPoints.put("LB-461-2", new Point(1012.2543, 626.41046));
        roomPoints.put("LB-445-1", new Point(916.1839, 859.94751));
        roomPoints.put("LB-445-2", new Point(659.21503, 823.23767));
        roomPoints.put("LB-451", new Point(659.99603, 721.69983));
        roomPoints.put("LB-453", new Point(659.21503, 602.97864));
        roomPoints.put("LB-459", new Point(658.43396, 313.9863));
        roomPoints.put("Bathroom-Men-1", new Point(928.68085, 274.15222));
        roomPoints.put("Bathroom-Men-2", new Point(337.41809, 674.83618));
        roomPoints.put("Bathroom-Women-1", new Point(946.6452, 768.56348));
        roomPoints.put("Bathroom-Women-2", new Point(331.95068, 713.10815));
        roomPoints.put("Elevator-1", new Point(431.92642, 673.27411));
        roomPoints.put("Stairs-Down-1", new Point(592.04382, 231.97495));
        roomPoints.put("Stairs-Down-2", new Point(524.87262, 230.41283));
        roomPoints.put("Stairs-Up-1", new Point(565.48773, 229.63176));
        roomPoints.put("Stairs-Down-3", new Point(588.13849, 821.67554));
        roomPoints.put("Stairs-Down-4", new Point(523.31049, 827.92407));
        roomPoints.put("Stairs-Up-2", new Point(560.80139, 824.01874));
        roomPoints.put("Emergency-Exit-1", new Point(910.71643, 352.25824));
        roomPoints.put("Emergency-Exit-2", new Point(946.6452, 695.1438));
        roomPoints.put("Emergency-Exit-3", new Point(263.21738, 622.50513));
        roomPoints.put("Emergency-Exit-4", new Point(322.57794, 981.79297));
        roomPoints.put("WaterFountain-1", new Point(927.89978, 253.06358));
        roomPoints.put("WaterFountain-2", new Point(923.99451, 727.9483));
        roomPoints.put("WaterFountain-3", new Point(306.95676, 694.36273));
        roomPoints.put("Study-Area-1", new Point(938.05359, 523.31049));
        roomPoints.put("Study-Area-2", new Point(106.22422, 948.20734));
        roomPoints.put("Study-Area-3", new Point(317.11053, 57.79847));
        roomPoints.put("Computer-Area-1", new Point(485.81958, 825.58087));
        roomPoints.put("Printer-1", new Point(492.06805, 213.22949));
        roomPoints.put("Shelve-20", new Point(292.11661, 180.42496));
        roomPoints.put("Shelve-21", new Point(432.70749, 352.25824));
        roomPoints.put("Shelve-24", new Point(390.53021, 948.20734));
        roomPoints.put("Shelve-25", new Point(483.47641, 952.89374));
        roomPoints.put("Shelve-26", new Point(844.32629, 527.99683));
    }

    private void initializeHall1Data() {
        // All coordinates are pre-computed in root SVG space (no runtime transforms needed)
        roomPoints.put("H1-118", new Point(1062.70415, 1015.30522));
        roomPoints.put("H1-118-4", new Point(1182.41605, 958.34202));
        roomPoints.put("H1-118-3", new Point(1134.79825, 981.92832));
        roomPoints.put("H1-118-2", new Point(1040.45285, 977.47812));
        roomPoints.put("H1-118-1", new Point(1004.40575, 1009.51992));
        roomPoints.put("H1-118-14", new Point(978.14917, 974.36282));
        roomPoints.put("H1-118-13", new Point(938.98682, 971.69272));
        roomPoints.put("H1-118-12", new Point(811.59186, 976.02982));
        roomPoints.put("H1-196-2", new Point(859.32715, 1191.98062));
        roomPoints.put("H1-196-1", new Point(839.30097, 1155.48842));
        roomPoints.put("H1-196", new Point(860.21723, 1131.01202));
        roomPoints.put("H1-116-4", new Point(837.96588, 1030.88112));
        roomPoints.put("H1-115", new Point(764.75946, 941.41462));
        roomPoints.put("H1-110", new Point(522.14917, 1197.75412));
        roomPoints.put("H1-110-2", new Point(266.07758, 1198.40402));
        roomPoints.put("H1-109s", new Point(131.54250, 1028.12282));
        roomPoints.put("Elevator", new Point(926.97113, 1126.11672));
        roomPoints.put("Bathroom-Men", new Point(695.02002, 1009.62702));
        roomPoints.put("Bathroom-Women", new Point(697.05622, 965.33992));
        roomPoints.put("Emergency-Exit", new Point(1325.65465, 1004.72742));
        roomPoints.put("Maisonneuve-Entry", new Point(511.75034, 1462.92462));
        roomPoints.put("Disability-Entrance", new Point(558.54517, 1457.07522));
        roomPoints.put("Metro-Entry", new Point(1074.26885, 1470.20732));
        roomPoints.put("Metro-Exit", new Point(1078.08735, 1438.70412));
        roomPoints.put("Bishop-Exit", new Point(1277.60735, 1330.82972));
        roomPoints.put("Stairs-Underground", new Point(1235.60325, 1227.72852));
        roomPoints.put("Art-Showcase", new Point(685.28107, 1476.57302));
    }

    private void initializeLB5Data() {
        roomPoints.put("LB-585-1", new Point(653.20508, 213.81894));
        roomPoints.put("LB-585-2", new Point(817.68121, 203.63708));
        roomPoints.put("LB-583", new Point(834.91205, 251.41347));
        roomPoints.put("LB-561-1", new Point(1008.7868, 471.49817));
        roomPoints.put("LB-562", new Point(900.70245, 500.47729));
        roomPoints.put("LB-564", new Point(897.56958, 534.93896));
        roomPoints.put("LB-547", new Point(853.70929, 785.56921));
        roomPoints.put("LB-545-1", new Point(824.73016, 832.56238));
        roomPoints.put("LB-545-2", new Point(650.85547, 827.86304));
        roomPoints.put("LB-555-1", new Point(776.9538, 433.90363));
        roomPoints.put("LB-555-2", new Point(783.18164, 599.71808));
        roomPoints.put("LB-527-540", new Point(449.13953, 876.64423));
        roomPoints.put("LB-522", new Point(408.466, 591.06415));
        roomPoints.put("LB-520", new Point(414.52377, 515.7749));
        roomPoints.put("LB-518", new Point(418.85074, 435.29321));
        roomPoints.put("LB-505-515-1", new Point(273.46454, 577.21783));
        roomPoints.put("LB-505-515-2", new Point(358.27316, 255.29126));
        roomPoints.put("Bathroom-Men-1", new Point(838.04492, 323.46967));
        roomPoints.put("Bathroom-Men-2", new Point(317.59964, 681.93054));
        roomPoints.put("Bathroom-Women-1", new Point(315.00345, 709.62317));
        roomPoints.put("Elevator-1", new Point(414.52377, 673.27661));
        roomPoints.put("Stairs-Down-1", new Point(548.25366, 224.00079));
        roomPoints.put("Stairs-Down-2", new Point(552.1214, 815.20123));
        roomPoints.put("Emergency-Exit-1", new Point(946.91241, 293.70734));
        roomPoints.put("Emergency-Exit-2", new Point(937.51379, 744.8418));
        roomPoints.put("Emergency-Exit-3", new Point(235.38719, 623.94916));
        roomPoints.put("WaterFountain-1", new Point(832.56238, 350.09915));
        roomPoints.put("WaterFountain-2", new Point(831.77917, 669.65271));
        roomPoints.put("WaterFountain-3", new Point(301.15714, 655.10333));
        roomPoints.put("Computer-Station-1", new Point(621.87634, 752.67401));
        roomPoints.put("Printer-1", new Point(859.19183, 364.98032));
        roomPoints.put("Shelve-27", new Point(429.23547, 347.88843));
        roomPoints.put("Shelve-28", new Point(713.513, 753.45721));
        roomPoints.put("Shelve-29", new Point(718.99554, 693.14929));
    }
    
    public static class Point {
        private double x;
        private double y;
        
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
        
        public double getX() { return x; }
        public double getY() { return y; }
        
        public double distanceTo(Point other) {
            double dx = x - other.x;
            double dy = y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
    
    public static class PointOfInterest {
        public final double x;
        public final double y;
        public final String id;
        public final String displayName;
        public final String type;

        public PointOfInterest(double x, double y, String id, String displayName, String type) {
            this.x = x; this.y = y; this.id = id; this.displayName = displayName; this.type = type;
        }
    }

    private static String getPoiType(String roomId) {
        String lower = roomId.toLowerCase();
        if (lower.startsWith("bathroom-men"))    return "bathroom-men";
        if (lower.startsWith("bathroom-women"))  return "bathroom-women";
        if (lower.startsWith("bathroom"))        return "bathroom-men";
        if (lower.startsWith("elevator"))        return "elevator";
        if (lower.startsWith("stairs-down"))     return "stairs-down";
        if (lower.startsWith("stairs-up"))       return "stairs-up";
        if (lower.startsWith("stairs-underground")) return "stairs";
        if (lower.startsWith("stairs"))          return "stairs";
        if (lower.startsWith("emergency-exit"))  return "emergency-exit";
        if (lower.startsWith("emergency-stairs"))return "emergency-exit";
        if (lower.startsWith("maisonneuve"))     return "emergency-exit";
        if (lower.startsWith("bishop"))          return "emergency-exit";
        if (lower.startsWith("mckay"))           return "emergency-exit";
        if (lower.startsWith("waterfountain"))   return "water-fountain";
        if (lower.startsWith("computer-station"))return "computer-station";
        if (lower.startsWith("computer-area"))   return "computer-station";
        if (lower.startsWith("study-area"))      return "study-area";
        if (lower.startsWith("sitting-area"))    return "study-area";
        if (lower.startsWith("tabling-area"))    return "study-area";
        if (lower.startsWith("entrance"))        return "entrance-exit";
        if (lower.startsWith("metro"))           return "entrance-exit";
        if (lower.startsWith("couch-area"))      return "study-area";
        if (lower.startsWith("stand"))           return "study-area";
        if (lower.startsWith("printer"))         return "printer";
        if (lower.startsWith("shelve"))          return "bookshelf";
        if (lower.startsWith("disability"))      return "entrance-exit";
        if (lower.startsWith("art-showcase"))    return "entrance-exit";
        if (lower.contains("emergency-exit"))    return "emergency-exit";
        if (lower.contains("bathroom-men"))      return "bathroom-men";
        if (lower.contains("bathroom-women"))    return "bathroom-women";
        if (lower.contains("bathroom"))          return "bathroom-men";
        if (lower.contains("elevator"))          return "elevator";
        if (lower.contains("stairs"))            return "stairs";
        return null;
    }

    /**
     * Returns all POIs for this floor.
     */
    public java.util.List<PointOfInterest> getPointsOfInterest() {
        java.util.List<PointOfInterest> pois = new java.util.ArrayList<>();
        for (Map.Entry<String, Point> entry : roomPoints.entrySet()) {
            String roomId = entry.getKey();
            String type = getPoiType(roomId);
            if (type == null) continue;
            String displayName = getBaseRoomId(roomId);
            Point p = entry.getValue();
            pois.add(new PointOfInterest(p.getX(), p.getY(), roomId, displayName, type));
        }
        return pois;
    }
}
