package com.soen390.backend.service;

import org.jgrapht.Graph;
import org.jgrapht.GraphPath;
import org.jgrapht.alg.connectivity.ConnectivityInspector;
import org.jgrapht.alg.shortestpath.DijkstraShortestPath;
import org.jgrapht.graph.DefaultWeightedEdge;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Indoor pathfinding service using JGraphT.
 *
 * Each floor is modeled as a weighted graph where:
 *   - Vertices = pre-defined waypoints extracted from SVG floor plans
 *   - Edges    = valid walkable connections constrained to corridor-like movement
 *   - Weights  = Euclidean distance between waypoints
 *
 */
@Service
public class PathfindingService {
    
    private static final Map<String, List<Waypoint>> WAYPOINTS = new HashMap<>();
    
    static {
       
        List<Waypoint> h8 = new ArrayList<>();
        h8.add(new Waypoint(174.08967, 272.18573, "point-allowed-hallway1"));
        h8.add(new Waypoint(174.08967, 332.85070, "point-allowed-hallway2"));
        h8.add(new Waypoint(180.93895, 414.06348, "point-allowed-hallway3"));
        h8.add(new Waypoint(184.85281, 493.31927, "point-allowed-hallway4"));
        h8.add(new Waypoint(182.89586, 576.48898, "point-allowed-hallway5"));
        h8.add(new Waypoint(183.87432, 667.48636, "point-allowed-hallway6"));
        h8.add(new Waypoint(183.87432, 767.29009, "point-allowed-hallway7"));
        h8.add(new Waypoint(188.76668, 836.76119, "point-allowed-hallway8"));
        h8.add(new Waypoint(133.97252, 856.33051, "point-allowed9"));
        h8.add(new Waypoint(265.08710, 849.48130, "point-allowed10"));
        h8.add(new Waypoint(356.08453, 849.48130, "point-allowed11"));
        h8.add(new Waypoint(466.65127, 848.50278, "point-allowed12"));
        h8.add(new Waypoint(637.88300, 848.50278, "point-allowed13"));
        h8.add(new Waypoint(728.88047, 854.37362, "point-allowed14"));
        h8.add(new Waypoint(834.55487, 856.33051, "point-allowed-hallway15"));
        h8.add(new Waypoint(849.23188, 755.54841, "point-allowed-hallway16"));
        h8.add(new Waypoint(845.31801, 654.76632, "point-allowed-hallway17"));
        h8.add(new Waypoint(845.31801, 557.89810, "point-allowed-hallway18"));
        h8.add(new Waypoint(843.36113, 475.70688, "point-allowed-hallway19"));
        h8.add(new Waypoint(847.27500, 389.60180, "point-allowed-hallway20"));
        h8.add(new Waypoint(846.29646, 306.43209, "point-allowed-hallway21"));
        h8.add(new Waypoint(809.11480, 263.37951, "point-allowed22"));
        h8.add(new Waypoint(743.55748, 256.53028, "point-allowed23"));
        h8.add(new Waypoint(648.64614, 260.44413, "point-allowed24"));
        h8.add(new Waypoint(478.39291, 259.46570, "point-allowed25"));
        h8.add(new Waypoint(385.43855, 262.40108, "point-allowed26"));
        h8.add(new Waypoint(300.31192, 259.46570, "point-allowed27"));
        h8.add(new Waypoint(203.44366, 268.27186, "point-allowed28"));
        h8.add(new Waypoint(141.80026, 238.91785, "point-allowed29"));
        h8.add(new Waypoint(557.64871, 853.39517, "point-allowed-hallway30"));
        h8.add(new Waypoint(560.58413, 762.39770, "point-allowed-hallway31"));
        h8.add(new Waypoint(558.62719, 626.39083, "point-allowed-hallway32"));
        h8.add(new Waypoint(559.60569, 488.42697, "point-allowed-hallway33"));
        h8.add(new Waypoint(556.67027, 371.01089, "point-allowed-hallway34"));
        h8.add(new Waypoint(557.64871, 268.27186, "point-allowed-hallway35"));
        h8.add(new Waypoint(485.24220, 448.30980, "point-allowed36"));
        h8.add(new Waypoint(412.83563, 442.43901, "point-allowed37"));
        h8.add(new Waypoint(315.96739, 445.37443, "point-allowed38"));
        h8.add(new Waypoint(225.94843, 450.26673, "point-allowed39"));
        h8.add(new Waypoint(186.80974, 451.24518, "point-allowed40"));
        h8.add(new Waypoint(555.69177, 439.50359, "point-allowed41"));
        h8.add(new Waypoint(492.09144, 524.63022, "point-allowed42"));
        h8.add(new Waypoint(489.15606, 601.92913, "point-allowed43"));
        h8.add(new Waypoint(497.96224, 682.16337, "point-allowed44"));
        h8.add(new Waypoint(562.54111, 695.86193, "point-allowed45"));
        h8.add(new Waypoint(418.70643, 854.37362, "point-allowed46"));
        h8.add(new Waypoint(408.92173, 776.09626, "point-allowed47"));
        h8.add(new Waypoint(845.26515, 267.79014, "point-allowed48"));
        h8.add(new Waypoint(549.12006, 324.88297, "point-allowed49"));
        WAYPOINTS.put("Hall-8", h8);

        // ── VL-1 ──
        List<Waypoint> vl1 = new ArrayList<>();
        vl1.add(new Waypoint(273.19421, 147.59822, "Allowedpath"));
        vl1.add(new Waypoint(607.81128, 153.09877, "AllowedPath2"));
        vl1.add(new Waypoint(806.74799, 151.26524, "AllowedPath3"));
        vl1.add(new Waypoint(816.83234, 545.47168, "AllowedPath4"));
        vl1.add(new Waypoint(782.91229, 543.63812, "AllowedPath5"));
        vl1.add(new Waypoint(781.07874, 742.57489, "AllowedPath6"));
        vl1.add(new Waypoint(615.14539, 264.02661, "AllowedPath7"));
        vl1.add(new Waypoint(620.64594, 421.7092, "AllowedPath8"));
        vl1.add(new Waypoint(616.97888, 358.45282, "AllowePath9"));
        vl1.add(new Waypoint(468.4639, 345.61819, "AllowedPath10"));
        vl1.add(new Waypoint(229.18977, 347.45169, "AllowedPath11"));
        vl1.add(new Waypoint(223.68922, 152.18201, "AllowedPath12"));
        vl1.add(new Waypoint(634.39728, 548.22192, "AllowedPath13"));
        vl1.add(new Waypoint(550.97223, 473.96445, "AllowedPath14"));
        vl1.add(new Waypoint(386.87234, 474.88123, "AllowedPath15"));
        vl1.add(new Waypoint(396.03995, 776.495, "AllowedPath16"));
        vl1.add(new Waypoint(122.84572, 779.24524, "AllowedPath17"));
        vl1.add(new Waypoint(122.84572, 645.39844, "AllowedPath18"));
        vl1.add(new Waypoint(281.44504, 645.39844, "AllowedPath19"));
        vl1.add(new Waypoint(276.86124, 487.71585, "AllowedPath20"));
        vl1.add(new Waypoint(121.0122, 944.2619, "AllowedPath21"));
        vl1.add(new Waypoint(267.69366, 926.84344, "AllowedPath22"));
        vl1.add(new Waypoint(556.47278, 756.32629, "AllowedPath23"));
        WAYPOINTS.put("VL-1", vl1);

        // ── VL-2 ──
        List<Waypoint> vl2 = new ArrayList<>();
        vl2.add(new Waypoint(616.35431, 203.6649, "AllowedPath1"));
        vl2.add(new Waypoint(619.57007, 335.51114, "AllowedPath2"));
        vl2.add(new Waypoint(733.19366, 349.44611, "AllowedPath3"));
        vl2.add(new Waypoint(249.75749, 348.37418, "AllowedPath4"));
        vl2.add(new Waypoint(475.93271, 353.73376, "AllowedPath5"));
        vl2.add(new Waypoint(823.23499, 352.66187, "AllowedPath6"));
        vl2.add(new Waypoint(828.5946, 461.99774, "AllowedPath7"));
        vl2.add(new Waypoint(827.52264, 552.03906, "AllowedPath8"));
        vl2.add(new Waypoint(331.22345, 354.80569, "AllowedPath9"));
        vl2.add(new Waypoint(340.87073, 452.35046, "AllowedPath10"));
        vl2.add(new Waypoint(345.15842, 503.80264, "AllowedPath11"));
        vl2.add(new Waypoint(278.69934, 517.73761, "AllowedPath12"));
        vl2.add(new Waypoint(293.70624, 818.94727, "AllowedPath13"));
        vl2.add(new Waypoint(116.83934, 840.38568, "AllowedPath14"));
        vl2.add(new Waypoint(130.77431, 944.362, "AllowedPath15"));
        vl2.add(new Waypoint(623.85773, 465.2135, "AllowedPath16"));
        vl2.add(new Waypoint(631.36121, 631.36121, "AllowedPath17"));
        vl2.add(new Waypoint(642.08038, 712.82715, "AllowedPath18"));
        vl2.add(new Waypoint(736.40942, 720.33063, "AllowedPath19"));
        vl2.add(new Waypoint(728.90594, 796.43695, "AllowedPath20"));
        WAYPOINTS.put("VL-2", vl2);

        // ── LB-2 ──
        List<Waypoint> lb2 = new ArrayList<>();
        lb2.add(new Waypoint(176.86403, 457.58429, "AllowedPath1"));
        lb2.add(new Waypoint(302.31412, 458.61255, "AllowedPath2"));
        lb2.add(new Waypoint(347.39804, 470.95715, "AllowedPath3"));
        lb2.add(new Waypoint(399.32867, 467.97263, "AllowedPath4"));
        lb2.add(new Waypoint(408.87915, 382.61539, "AllowedPath5"));
        lb2.add(new Waypoint(412.46057, 250.69962, "AllowedPath6"));
        lb2.add(new Waypoint(338.44449, 248.31201, "AllowedPath7"));
        lb2.add(new Waypoint(286.51385, 246.52129, "AllowedPath8"));
        lb2.add(new Waypoint(236.37393, 248.90891, "AllowedPath9"));
        lb2.add(new Waypoint(234.58322, 294.27359, "AllowedPath10"));
        lb2.add(new Waypoint(230.40489, 385.59988, "AllowedPath11"));
        lb2.add(new Waypoint(99.682945, 327.70023, "allowedPath12"));
        lb2.add(new Waypoint(101.47366, 171.3114, "AllowedPath13"));
        lb2.add(new Waypoint(470.36023, 251.29652, "AllowedPath14"));
        lb2.add(new Waypoint(852.37872, 242.93987, "AllowedPath15"));
        lb2.add(new Waypoint(866.10748, 273.38196, "AllowedPath16"));
        lb2.add(new Waypoint(616.60168, 250.10272, "AllowedPath17"));
        lb2.add(new Waypoint(609.43884, 351.57639, "AllowdPath19"));
        lb2.add(new Waypoint(608.84192, 448.27481, "AllowedPath20"));
        lb2.add(new Waypoint(612.42334, 634.50879, "AllowedPath21"));
        lb2.add(new Waypoint(609.43884, 511.5466, "AllowedPath22"));
        lb2.add(new Waypoint(612.42334, 724.6413, "AllowedPath23"));
        lb2.add(new Waypoint(584.3689, 727.02887, "AllowedPath24"));
        lb2.add(new Waypoint(584.3689, 782.54095, "AllowedPath25"));
        lb2.add(new Waypoint(736.57935, 780.75024, "AllowedPath26"));
        lb2.add(new Waypoint(865.51062, 779.55646, "AllowedPath37"));
        lb2.add(new Waypoint(864.31677, 685.84253, "AllowedPath27"));
        lb2.add(new Waypoint(866.70441, 638.09021, "Allowed-Path28"));
        lb2.add(new Waypoint(909.08459, 639.88092, "AllowedPath29"));
        lb2.add(new Waypoint(612.42334, 396.94107, "AllowedPath30"));
        lb2.add(new Waypoint(709.71869, 405.29773, "AllowedPath31"));
        lb2.add(new Waypoint(880.43317, 401.71631, "AllowedPath32"));
        lb2.add(new Waypoint(866.10748, 362.91754, "AllowedPath33"));
        lb2.add(new Waypoint(667.3385, 740.16077, "AlloedPath34"));
        lb2.add(new Waypoint(705.54034, 741.95148, "AllowedPath35"));
        lb2.add(new Waypoint(706.73419, 665.54779, "AlloedPath36"));
        lb2.add(new Waypoint(518.70947, 778.36261, "AllowedPath37"));
        lb2.add(new Waypoint(434.54602, 781.34717, "AllowedPath38"));
        lb2.add(new Waypoint(324.7157, 775.37811, "AllowedPath39"));
        lb2.add(new Waypoint(398.13489, 778.36261, "AllowedPAth40"));
        lb2.add(new Waypoint(397.53796, 931.76691, "AllowedPath41"));
        lb2.add(new Waypoint(397.53796, 972.95331, "AllowedPath42"));
        lb2.add(new Waypoint(426.78625, 669.12921, "AllowedPath43"));
        lb2.add(new Waypoint(405.29773, 667.3385, "AllowedPath44"));
        lb2.add(new Waypoint(403.50702, 576.60913, "AllowedPath45"));
        lb2.add(new Waypoint(287.11075, 574.81842, "AllowedPath46"));
        lb2.add(new Waypoint(239.35844, 568.84937, "AllowedPath47"));
        lb2.add(new Waypoint(152.21048, 572.43079, "AllowedPath48"));
        WAYPOINTS.put("LB-2", lb2);

        // ── LB-3 ──
        List<Waypoint> lb3 = new ArrayList<>();
        lb3.add(new Waypoint(558.31384, 265.48685, "Allowedpath1"));
        lb3.add(new Waypoint(620.90833, 264.04791, "AllowedPath2"));
        lb3.add(new Waypoint(658.32111, 271.96216, "AllowedPath3"));
        lb3.add(new Waypoint(899.34576, 273.40109, "AllowedPath4"));
        lb3.add(new Waypoint(907.26001, 312.97232, "AllowedPath5"));
        lb3.add(new Waypoint(907.26001, 359.73828, "AllowedPath6"));
        lb3.add(new Waypoint(914.45477, 400.74847, "AllowedPath7"));
        lb3.add(new Waypoint(940.3559, 398.59003, "AllowedPath8"));
        lb3.add(new Waypoint(1010.1451, 403.62637, "AllowedPath9"));
        lb3.add(new Waypoint(858.33557, 405.78479, "AllowedPath10"));
        lb3.add(new Waypoint(861.2135, 655.44318, "AllowedPath11"));
        lb3.add(new Waypoint(946.83118, 661.19897, "AllowedPath12"));
        lb3.add(new Waypoint(1013.7425, 656.88214, "AllowedPath13"));
        lb3.add(new Waypoint(910.13788, 657.60162, "AllowedPath14"));
        lb3.add(new Waypoint(905.82104, 710.12341, "AllowedPath15"));
        lb3.add(new Waypoint(906.54053, 774.87628, "AllowedPath16"));
        lb3.add(new Waypoint(904.38208, 802.21637, "AllowedPath17"));
        lb3.add(new Waypoint(656.16266, 795.74109, "AllowedPath18"));
        lb3.add(new Waypoint(617.31091, 792.14374, "AllowedPath19"));
        lb3.add(new Waypoint(622.34723, 730.26874, "AllowedPath20"));
        lb3.add(new Waypoint(622.34723, 615.87195, "AllowedPath21"));
        lb3.add(new Waypoint(626.66412, 316.5697, "AllowedPath22"));
        lb3.add(new Waypoint(549.68011, 790.70477, "AllowedPath23"));
        lb3.add(new Waypoint(464.78189, 799.3385, "AllowedPath24"));
        lb3.add(new Waypoint(465.50134, 713.00128, "AllowedPath25"));
        lb3.add(new Waypoint(466.94031, 630.26147, "AllowedPath26"));
        lb3.add(new Waypoint(297.14383, 629.54199, "AllowedPath27"));
        lb3.add(new Waypoint(276.99847, 624.50568, "AllowedPath28"));
        lb3.add(new Waypoint(276.99847, 676.30798, "AllowedPath29"));
        lb3.add(new Waypoint(278.43744, 715.87921, "AllowedPath30"));
        lb3.add(new Waypoint(279.15692, 741.7804, "AllowedPath31"));
        lb3.add(new Waypoint(282.03482, 805.0943, "AllowedPath32"));
        lb3.add(new Waypoint(119.43311, 794.30219, "AllowedPath33"));
        lb3.add(new Waypoint(112.95782, 253.97523, "AllowedPath34"));
        lb3.add(new Waypoint(198.57555, 243.18309, "AllowedPath35"));
        lb3.add(new Waypoint(318.00867, 242.46361, "AllowedPath36"));
        lb3.add(new Waypoint(288.5101, 320.16708, "AllowedPath37"));
        lb3.add(new Waypoint(109.36044, 315.13074, "AllowedPath38"));
        lb3.add(new Waypoint(419.45486, 259.73105, "AllowedPath39"));
        lb3.add(new Waypoint(439.60019, 200.0145, "AllowedPath40"));
        lb3.add(new Waypoint(438.88071, 122.31102, "AllowedPath41"));
        lb3.add(new Waypoint(118.71364, 189.94182, "AllowedPath42"));
        lb3.add(new Waypoint(474.85455, 266.20633, "AllowedPath43"));
        lb3.add(new Waypoint(471.97665, 361.17725, "AllowedPath44"));
        lb3.add(new Waypoint(475.57404, 628.82257, "AllowedPath45"));
        lb3.add(new Waypoint(425.93015, 912.29633, "AllowedPath46"));
        lb3.add(new Waypoint(418.0159, 964.81812, "AllowedPath47"));
        lb3.add(new Waypoint(271.96216, 963.37915, "AllowedPath48"));
        lb3.add(new Waypoint(271.24268, 992.1582, "AllowedPath49"));
        lb3.add(new Waypoint(356.86038, 253.97523, "AllowedPath50"));
        WAYPOINTS.put("LB-3", lb3);

        // ── LB-4 ──
        List<Waypoint> lb4 = new ArrayList<>();
        lb4.add(new Waypoint(567.04987, 265.56055, "AllowedPath1"));
        lb4.add(new Waypoint(631.0968, 267.12265, "AllowedPath2"));
        lb4.add(new Waypoint(660.7771, 263.21738, "AllowedPath3"));
        lb4.add(new Waypoint(912.27856, 263.99841, "AllowedPath4"));
        lb4.add(new Waypoint(914.62177, 401.46506, "AllowedPath5"));
        lb4.add(new Waypoint(993.50885, 392.09235, "AllowedPath6"));
        lb4.add(new Waypoint(1010.6922, 648.28015, "AllowedPath7"));
        lb4.add(new Waypoint(913.05963, 652.96649, "AllowedPath8"));
        lb4.add(new Waypoint(916.1839, 524.87262, "AllowedPath9"));
        lb4.add(new Waypoint(912.27856, 701.39227, "AllowedPath10"));
        lb4.add(new Waypoint(913.05963, 772.46875, "AllowedPath11"));
        lb4.add(new Waypoint(906.81116, 795.11951, "AllowedPath12"));
        lb4.add(new Waypoint(726.38617, 793.55737, "AllowedPath13"));
        lb4.add(new Waypoint(634.22107, 790.43317, "AllowedPath14"));
        lb4.add(new Waypoint(660.7771, 788.08997, "AllowedPath15"));
        lb4.add(new Waypoint(628.75366, 784.9657, "AllowedPath16"));
        lb4.add(new Waypoint(626.41046, 723.26196, "AllowedPath17"));
        lb4.add(new Waypoint(627.19153, 605.32184, "AllowedPath18"));
        lb4.add(new Waypoint(635.7832, 321.01584, "AllowedPath19"));
        lb4.add(new Waypoint(591.26276, 784.18469, "AllowedPath20"));
        lb4.add(new Waypoint(557.67712, 785.74677, "AllowedPath21"));
        lb4.add(new Waypoint(523.31049, 781.06042, "AllowedPath22"));
        lb4.add(new Waypoint(488.94382, 781.06042, "AllowedPath23"));
        lb4.add(new Waypoint(449.10974, 775.59302, "AllowedPath24"));
        lb4.add(new Waypoint(444.42337, 936.49146, "AllowedPath25"));
        lb4.add(new Waypoint(315.5484, 934.14825, "AllowedPath26"));
        lb4.add(new Waypoint(313.20523, 951.3316, "AllowedPath27"));
        lb4.add(new Waypoint(282.74387, 950.55054, "AllowedPath28"));
        lb4.add(new Waypoint(285.08707, 978.6687, "AllowedPath29"));
        lb4.add(new Waypoint(130.43709, 944.30206, "AllowedPath30"));
        lb4.add(new Waypoint(129.65604, 703.73541, "AllowedPath31"));
        lb4.add(new Waypoint(294.45978, 699.04907, "AllowedPath32"));
        lb4.add(new Waypoint(293.67871, 664.68243, "AllowedPath33"));
        lb4.add(new Waypoint(294.45978, 720.91876, "AllowedPath34"));
        lb4.add(new Waypoint(298.36508, 763.87708, "AllowedPath35"));
        lb4.add(new Waypoint(468.63626, 768.56348, "AllowedPath36"));
        lb4.add(new Waypoint(469.41733, 686.55212, "AllowedPath37"));
        lb4.add(new Waypoint(460.04459, 617.03772, "AllowedPath38"));
        lb4.add(new Waypoint(298.36508, 622.50513, "AllowedPath39"));
        lb4.add(new Waypoint(460.04459, 428.02112, "Allowed-Path40"));
        lb4.add(new Waypoint(299.92722, 426.45898, "Allowed-Path41"));
        lb4.add(new Waypoint(267.12265, 414.74307, "Allowed-Path42"));
        lb4.add(new Waypoint(292.11661, 332.73175, "Allowed-Path43"));
        lb4.add(new Waypoint(131.99921, 335.07492, "Allowed-Path44"));
        lb4.add(new Waypoint(131.21815, 338.19916, "Allowed-Path45"));
        lb4.add(new Waypoint(292.11661, 328.82645, "AllowedPath46"));
        lb4.add(new Waypoint(296.80295, 280.4007, "AllowedPath47"));
        lb4.add(new Waypoint(465.51202, 271.02795, "AllowedPath48"));
        lb4.add(new Waypoint(463.94989, 360.06885, "AllowedPath49"));
        lb4.add(new Waypoint(451.45291, 272.59009, "AllowedPath50"));
        lb4.add(new Waypoint(492.06805, 268.68478, "AllowedPath51"));
        lb4.add(new Waypoint(126.53179, 124.96967, "AllowedPath52"));
        lb4.add(new Waypoint(164.02269, 101.53786, "AllowedPath53"));
        lb4.add(new Waypoint(164.02269, 74.200737, "AllowedPath54"));
        lb4.add(new Waypoint(450.67188, 74.200737, "AllowedPath55"));
        lb4.add(new Waypoint(302.27039, 74.200737, "AllowedPath56"));
        WAYPOINTS.put("LB-4", lb4);

        // ── LB-5 ──
        List<Waypoint> lb5 = new ArrayList<>();
        lb5.add(new Waypoint(552.953, 254.54636, "AllowedPath1"));
        lb5.add(new Waypoint(621.09308, 254.54636, "AllowedPath2"));
        lb5.add(new Waypoint(658.68762, 253.76314, "AllowedPath3"));
        lb5.add(new Waypoint(817.68121, 257.67923, "AllowedPath4"));
        lb5.add(new Waypoint(810.6322, 296.84021, "AllowedPath5"));
        lb5.add(new Waypoint(814.54834, 327.38577, "AllowedPath6"));
        lb5.add(new Waypoint(820.03088, 404.9245, "AllowedPath7"));
        lb5.add(new Waypoint(863.89117, 403.35806, "AllowedPath8"));
        lb5.add(new Waypoint(937.51379, 401.00839, "AllowedPath9"));
        lb5.add(new Waypoint(1011.1364, 397.87552, "AllowedPath10"));
        lb5.add(new Waypoint(942.21313, 498.12762, "AllowedPath11"));
        lb5.add(new Waypoint(946.12921, 541.98792, "AllowedPath12"));
        lb5.add(new Waypoint(946.91241, 639.89038, "AllowedPath13"));
        lb5.add(new Waypoint(1011.9197, 637.54071, "AllowedPath14"));
        lb5.add(new Waypoint(821.59729, 634.40784, "AllowedPath15"));
        lb5.add(new Waypoint(813.76514, 678.26813, "AllowedPath16"));
        lb5.add(new Waypoint(814.54834, 711.16333, "AllowedPath17"));
        lb5.add(new Waypoint(813.76514, 739.35925, "AllowedPath18"));
        lb5.add(new Waypoint(814.54834, 786.35242, "AllowedPath19"));
        lb5.add(new Waypoint(733.09351, 788.70209, "AllowedPath20"));
        lb5.add(new Waypoint(655.55475, 788.70209, "AllowedPath21"));
        lb5.add(new Waypoint(723.69489, 787.91888, "AllowedPath22"));
        lb5.add(new Waypoint(820.03088, 434.68686, "AllowedPath23"));
        lb5.add(new Waypoint(826.45135, 603.17969, "AllowedPath24"));
        lb5.add(new Waypoint(552.98682, 784.91241, "AllowedPath25"));
        lb5.add(new Waypoint(455.1973, 797.89337, "AllowedPath26"));
        lb5.add(new Waypoint(466.44742, 728.6618, "AllowedPath27"));
        lb5.add(new Waypoint(463.85123, 675.00739, "AllowedPath28"));
        lb5.add(new Waypoint(456.06268, 620.48755, "AllowedPath29"));
        lb5.add(new Waypoint(286.44543, 626.54535, "AllowedPath30"));
        lb5.add(new Waypoint(281.25308, 673.27661, "AllowedPath31"));
        lb5.add(new Waypoint(283.84927, 713.08472, "AllowedPath32"));
        lb5.add(new Waypoint(462.98584, 596.25653, "AllowedPath33"));
        lb5.add(new Waypoint(452.6011, 520.96722, "AllowedPath34"));
        lb5.add(new Waypoint(456.06268, 439.62021, "AllowedPath35"));
        lb5.add(new Waypoint(456.92807, 355.67697, "AllowedPath36"));
        lb5.add(new Waypoint(453.46649, 298.56097, "AllowedPath37"));
        lb5.add(new Waypoint(448.27414, 257.02203, "AllowedPath38"));
        lb5.add(new Waypoint(887.89435, 289.04163, "AllowedPath39"));
        WAYPOINTS.put("LB-5", lb5);

        // ── Hall-9 (all coordinates pre-computed in root SVG space) ──
        List<Waypoint> h9 = new ArrayList<>();
        h9.add(new Waypoint(166.06937, 230.79725, "Allowed-path1"));
        h9.add(new Waypoint(171.53294, 300.91315, "Allowed-path2"));
        h9.add(new Waypoint(181.54946, 373.76093, "Allowed-path3"));
        h9.add(new Waypoint(196.11905, 406.54240, "Allowed-path4"));
        h9.add(new Waypoint(298.10584, 403.81058, "Allowed-path5"));
        h9.add(new Waypoint(528.48674, 402.90001, "Allowed-path6"));
        h9.add(new Waypoint(527.57617, 323.67809, "Allowed-path7"));
        h9.add(new Waypoint(528.48674, 231.70782, "Allowed-path8"));
        h9.add(new Waypoint(422.85756, 225.33368, "Allowed-path9"));
        h9.add(new Waypoint(644.13251, 227.15487, "Allowed-path10"));
        h9.add(new Waypoint(840.82133, 226.24424, "Allowed-path11"));
        h9.add(new Waypoint(840.82133, 407.45296, "Allowed-path12"));
        h9.add(new Waypoint(845.37431, 572.27095, "Allowed-path13"));
        h9.add(new Waypoint(801.66569, 571.36035, "Allowed-path14"));
        h9.add(new Waypoint(798.02330, 647.85049, "Allowed-path15"));
        h9.add(new Waypoint(650.50669, 652.40347, "Allowed-path16"));
        h9.add(new Waypoint(502.07947, 655.13525, "Allowed-path17"));
        h9.add(new Waypoint(530.30791, 534.93653, "Allowed-path18"));
        h9.add(new Waypoint(460.19203, 676.07900, "Allowed-path19"));
        h9.add(new Waypoint(369.13238, 661.50940, "Allowed-path20"));
        h9.add(new Waypoint(83.20508, 662.42000, "Allowed-path21"));
        h9.add(new Waypoint(78.65206, 513.99281, "Allowed-path22"));
        h9.add(new Waypoint(78.65206, 896.44332, "Allowed-path23"));
        h9.add(new Waypoint(371.86417, 897.35396, "Allowed-path24"));
        h9.add(new Waypoint(401.00324, 843.62874, "Allowed-path25"));
        h9.add(new Waypoint(418.30455, 692.46974, "Allowed-path26"));
        h9.add(new Waypoint(665.07622, 744.37373, "Allowed-path27"));
        h9.add(new Waypoint(704.23186, 835.43337, "Allowed-path28"));
        h9.add(new Waypoint(812.59288, 843.62874, "Allowed-path29"));
        h9.add(new Waypoint(820.78826, 683.36372, "Alowed-path30"));
        h9.add(new Waypoint(944.66794, 618.04366, "AllowedPath-new1"));
        h9.add(new Waypoint(961.04800, 617.06577, "AllowedPath-new2"));
        h9.add(new Waypoint(659.26116, 868.96152, "AllowedPath-new3"));
        h9.add(new Waypoint(689.13706, 901.96726, "AllowedPath-new4"));
        h9.add(new Waypoint(404.26581, 930.95157, "AllowedPath-new5"));
        h9.add(new Waypoint(271.84425, 903.54709, "AllowedPath-new6"));
        h9.add(new Waypoint(224.03649, 903.94718, "AllowedPath-new7"));
        h9.add(new Waypoint(177.42891, 903.54709, "AllowedPath-new8"));
        h9.add(new Waypoint(130.62128, 903.14701, "AllowedPath-new9"));
        h9.add(new Waypoint(80.81318, 870.94181, "AllowedPath-new10"));
        h9.add(new Waypoint(80.01300, 832.33549, "AllowedPath-new11"));
        h9.add(new Waypoint(78.41277, 788.12832, "AllowedPath-new12"));
        h9.add(new Waypoint(80.41312, 742.12082, "AllowedPath-new13"));
        h9.add(new Waypoint(83.21352, 702.71438, "AllowedPath-new14"));
        h9.add(new Waypoint(151.09128, 664.62448, "AllowedPath-new15"));
        h9.add(new Waypoint(215.78139, 668.83375, "AllowedPath-new16"));
        h9.add(new Waypoint(300.85330, 669.94148, "AllowedPath-new17"));
        h9.add(new Waypoint(401.45952, 757.25222, "AllowedPath-new18"));
        h9.add(new Waypoint(403.50429, 806.32712, "AllowedPath-new19"));
        h9.add(new Waypoint(502.67640, 590.26143, "AllowedPath-new20"));
        h9.add(new Waypoint(501.31320, 474.04943, "AllowedPath-new21"));
        h9.add(new Waypoint(373.51412, 406.23069, "AllowedPath-new22"));
        h9.add(new Waypoint(431.44975, 407.25314, "AllowedPath-new23"));
        h9.add(new Waypoint(343.52395, 228.33437, "AllowedPath-new24"));
        h9.add(new Waypoint(722.49081, 234.12794, "AllowedPath-new25"));
        h9.add(new Waypoint(514.15505, 436.38211, "AllowedPath-new26"));
        WAYPOINTS.put("Hall-9", h9);

        // ── Hall-2 (no transform needed) ──
        List<Waypoint> h2 = new ArrayList<>();
        h2.add(new Waypoint(431.63757, 1239.6705, "AllowedPath2"));
        h2.add(new Waypoint(895.10956, 1254.6515, "AllowedPath3"));
        h2.add(new Waypoint(892.30066, 1178.8105, "upstairs-start"));
        h2.add(new Waypoint(748.10938, 1265.8872, "AllowedPath5"));
        h2.add(new Waypoint(743.4278, 1182.5558, "downstairs-end"));
        h2.add(new Waypoint(894.17328, 974.69568, "upstairs-end"));
        h2.add(new Waypoint(1000.9122, 1259.333, "AllowedPath8"));
        h2.add(new Waypoint(999.03967, 1195.6642, "AllowedPath9"));
        h2.add(new Waypoint(997.16705, 1087.9888, "AllowedPath11"));
        h2.add(new Waypoint(430.70126, 1193.7915, "AllowedPath13"));
        h2.add(new Waypoint(739.68262, 971.88672, "downstairs-start"));
        h2.add(new Waypoint(895.10956, 955.96954, "AllowedPath16"));
        h2.add(new Waypoint(742.49152, 951.28796, "AllowedPath17"));
        h2.add(new Waypoint(747.17303, 852.03943, "AllowedPath18"));
        h2.add(new Waypoint(743.4278, 687.24939, "AllowedPath20"));
        h2.add(new Waypoint(746.23676, 636.68878, "AllowedPath22"));
        h2.add(new Waypoint(821.1413, 642.30664, "AllowedPath23"));
        h2.add(new Waypoint(818.3324, 955.96954, "AllowedPath25"));
        h2.add(new Waypoint(998.10333, 641.37036, "AllowedPath29"));
        h2.add(new Waypoint(1095.4792, 635.7525, "AllowedPath31"));
        h2.add(new Waypoint(1140.422, 638.5614, "AllowedPath33"));
        h2.add(new Waypoint(1143.231, 753.72717, "AllowedPath35"));
        h2.add(new Waypoint(1035.5557, 754.66351, "AllowedPath36"));
        h2.add(new Waypoint(1040.2372, 824.88654, "AllowedPath37"));
        h2.add(new Waypoint(1036.4919, 974.69568, "AllowedPath39"));
        h2.add(new Waypoint(697.54877, 635.7525, "AllowedPath42"));
        h2.add(new Waypoint(693.80353, 543.99438, "AllowedPath43"));
        h2.add(new Waypoint(697.54877, 592.68237, "AllowedPath44"));
        h2.add(new Waypoint(591.74609, 594.55499, "AllowedPath45"));
        h2.add(new Waypoint(422.27448, 602.04547, "AllowedPath46"));
        h2.add(new Waypoint(308.98132, 611.40851, "AllowedPath48"));
        h2.add(new Waypoint(148.87282, 621.70789, "AllowedPath49"));
        h2.add(new Waypoint(308.98132, 519.65045, "AllowedPath51"));
        h2.add(new Waypoint(310.85394, 442.87326, "AllowedPath52"));
        h2.add(new Waypoint(309.91763, 410.10251, "AllowedPath53"));
        h2.add(new Waypoint(310.85394, 336.13425, "AllowedPath56"));
        h2.add(new Waypoint(308.98132, 296.80936, "AllowedPath58"));
        h2.add(new Waypoint(382.01328, 445.68216, "AllowedPath60"));
        h2.add(new Waypoint(426.95602, 439.12802, "AllowedPath62"));
        h2.add(new Waypoint(591.74609, 536.50397, "AllowedPath64"));
        h2.add(new Waypoint(536.50397, 529.94983, "AllowedPath65"));
        h2.add(new Waypoint(534.63135, 476.58029, "AllowedPath66"));
        h2.add(new Waypoint(493.43384, 478.45291, "AllowedPath67"));
        h2.add(new Waypoint(486.87967, 382.01328, "AllowedPath68"));
        h2.add(new Waypoint(690.99463, 307.10873, "AllowedPath70"));
        h2.add(new Waypoint(560.84796, 308.98132, "AllowedPath71"));
        h2.add(new Waypoint(192.87926, 615.15375, "AllowedPath74"));
        h2.add(new Waypoint(184.4525, 679.75891, "AllowedPath75"));
        h2.add(new Waypoint(88.949173, 669.45953, "AllowedPath76"));
        h2.add(new Waypoint(74.904564, 731.2558, "AllowedPath77"));
        h2.add(new Waypoint(73.031952, 865.14771, "AllowedPath78"));
        h2.add(new Waypoint(102.05747, 868.89294, "AllowedPath80"));
        h2.add(new Waypoint(632.9436, 640.43402, "AllowedPath83"));
        h2.add(new Waypoint(632.00726, 742.49152, "AllowedPath84"));
        h2.add(new Waypoint(594.55499, 740.6189, "AllowedPath85"));
        h2.add(new Waypoint(594.55499, 769.64441, "AllowedPath86"));
        h2.add(new Waypoint(593.61871, 878.25604, "AllowedPath88"));
        h2.add(new Waypoint(487.0, 439.0, "AllowedPath89"));
        h2.add(new Waypoint(487.0, 310.0, "AllowedPath90"));
        h2.add(new Waypoint(590.0, 1253.0, "AllowedPath91"));
        WAYPOINTS.put("Hall-2", h2);

        // ── MB-S2 ──
        List<Waypoint> MBS2 = new ArrayList<>();
        MBS2.add(new Waypoint(111.80209, 497.20117, "AllowedPath1"));
        MBS2.add(new Waypoint(420.84851, 476.29507, "AllowedPath2"));
        MBS2.add(new Waypoint(477.20404, 468.11444, "AllowedPath3"));
        MBS2.add(new Waypoint(458.11588, 278.14178, "AllowedPath4"));
        MBS2.add(new Waypoint(459.93381, 224.51314, "AllowedPath5"));
        MBS2.add(new Waypoint(578.09863, 221.78625, "AllowedPath6"));
        MBS2.add(new Waypoint(641.72583, 218.15042, "AllowedPath7"));
        MBS2.add(new Waypoint(679.90216, 220.8773, "AllowedPath8"));
        MBS2.add(new Waypoint(718.98743, 224.51314, "AllowedPath9"));
        MBS2.add(new Waypoint(527.19684, 226.33105, "AllowedPath10"));
        MBS2.add(new Waypoint(534.46851, 618.09283, "AllowedPath11"));
        MBS2.add(new Waypoint(590.82404, 602.64056, "AllowedPath12"));
        MBS2.add(new Waypoint(537.19543, 605.36743, "AllowedPath13"));
        MBS2.add(new Waypoint(678.99316, 601.73157, "AllowedPath14"));
        MBS2.add(new Waypoint(749.89209, 604.45844, "AllowedPath15"));
        MBS2.add(new Waypoint(809.88342, 602.64056, "AllowedPath16"));
        MBS2.add(new Waypoint(594.4599, 700.80823, "AllowedPath17"));
        MBS2.add(new Waypoint(593.5509, 788.06842, "AllowedPath18"));
        MBS2.add(new Waypoint(597.18677, 845.33289, "AllowedPath19"));
        MBS2.add(new Waypoint(673.53943, 842.60602, "AllowedPath20"));
        MBS2.add(new Waypoint(724.44116, 843.51495, "AllowedPath21"));
        MBS2.add(new Waypoint(758.07269, 843.51495, "AllowedPath22"));
        MBS2.add(new Waypoint(810.79242, 842.60602, "AllowedPath23"));
        MBS2.add(new Waypoint(887.14502, 841.69702, "AllowedPath24"));
        MBS2.add(new Waypoint(528.10583, 409.94101, "AllowedPath25"));
        WAYPOINTS.put("MB-S2", MBS2);

        // ── Hall-1 (all coordinates pre-computed in root SVG space) ──
        List<Waypoint> hall1 = new ArrayList<>();
        hall1.add(new Waypoint(1156.36795, 1440.61342, "AllowedPath1"));
        hall1.add(new Waypoint(1160.18645, 1335.60292, "AllowedPath2"));
        hall1.add(new Waypoint(1161.14115, 1227.72852, "AllowedPath3"));
        hall1.add(new Waypoint(1163.72505, 1109.20572, "AllowedPath4"));
        hall1.add(new Waypoint(1284.32705, 1104.31052, "AllowedPath5"));
        hall1.add(new Waypoint(1084.95535, 1101.64032, "AllowedPath6"));
        hall1.add(new Waypoint(1165.06015, 1067.81832, "AllowedPath7"));
        hall1.add(new Waypoint(1117.88735, 1064.25812, "allowed-path-contains-stairs"));
        hall1.add(new Waypoint(1101.42135, 1061.58792, "AllowedPath9"));
        hall1.add(new Waypoint(1105.42655, 1013.97012, "AllowedPath10"));
        hall1.add(new Waypoint(1183.75115, 1010.85502, "AllowedPath11"));
        hall1.add(new Waypoint(1145.92405, 1011.30002, "AllowedPath12"));
        hall1.add(new Waypoint(1181.08095, 986.37862, "AllowedPath13"));
        hall1.add(new Waypoint(1074.71975, 982.37332, "AllowedPath14"));
        hall1.add(new Waypoint(980.81928, 1012.63502, "AllowedPath15"));
        hall1.add(new Waypoint(942.10205, 1016.64032, "AllowedPath16"));
        hall1.add(new Waypoint(950.11249, 1101.64032, "AllowedPath17"));
        hall1.add(new Waypoint(923.85596, 1101.19532, "AllowedPath18"));
        hall1.add(new Waypoint(861.10730, 1102.08542, "AllowedPath19"));
        hall1.add(new Waypoint(860.21723, 1157.71372, "AllowedPath20"));
        hall1.add(new Waypoint(861.55231, 1029.99112, "AllowedPath21"));
        hall1.add(new Waypoint(860.66223, 1046.90212, "AllowedPath22"));
        hall1.add(new Waypoint(814.82453, 1032.66132, "AllowedPath23"));
        hall1.add(new Waypoint(770.86804, 1103.80072, "AllowedPath24"));
        hall1.add(new Waypoint(766.79566, 1011.15412, "AllowedPath25"));
        hall1.add(new Waypoint(767.30475, 973.48452, "AllowedPath26"));
        hall1.add(new Waypoint(734.21668, 977.55692, "AllowedPath27"));
        hall1.add(new Waypoint(1109.03415, 1440.17722, "AllowedPath28"));
        hall1.add(new Waypoint(1106.43435, 1405.73102, "AllowedPath29"));
        hall1.add(new Waypoint(728.82623, 1414.83002, "AllowedPath30"));
        hall1.add(new Waypoint(732.07587, 1477.22312, "AllowedPath31"));
        hall1.add(new Waypoint(516.94977, 1416.12982, "AllowedPath32"));
        hall1.add(new Waypoint(555.94544, 1417.42962, "AllowedPath33"));
        hall1.add(new Waypoint(534.49780, 1347.88742, "AllowedPath34"));
        hall1.add(new Waypoint(267.37744, 1360.23602, "AllowedPath35"));
        hall1.add(new Waypoint(650.18500, 1418.72952, "AllowedPath36"));
        hall1.add(new Waypoint(649.53504, 1349.83722, "AllowedPath37"));
        hall1.add(new Waypoint(268.02738, 1225.70102, "AllowedPath38"));
        hall1.add(new Waypoint(773.67127, 1223.75112, "AllowedPath39"));
        hall1.add(new Waypoint(785.37000, 1416.77972, "AllowedPath40"));
        hall1.add(new Waypoint(528.64844, 1229.60052, "AllowedPath41"));
        hall1.add(new Waypoint(115.94423, 1189.95492, "allowed-path-with-stairs"));
        hall1.add(new Waypoint(110.74481, 1106.76412, "AllowedPath43"));
        hall1.add(new Waypoint(112.04466, 1084.66652, "AllowedPath44"));
        hall1.add(new Waypoint(130.89258, 1085.31642, "AllowedPath45"));
        hall1.add(new Waypoint(1330.03695, 1099.67682, "AllowedPath46"));
        WAYPOINTS.put("Hall-1", hall1);
    }

    private record BuildingConfig(
            double searchRadius,
            double alignThreshold,
            int maxNeighbors,
            boolean strictAlignment
    ) {
        static BuildingConfig forBuilding(String buildingId) {
            if (buildingId.startsWith("LB-"))
                return new BuildingConfig(400.0, 6.0, 4, true);
            if ("Hall-9".equals(buildingId))
                return new BuildingConfig(200.0, 25.0, 0, false);
            if ("Hall-2".equals(buildingId))
                return new BuildingConfig(300.0, 15.0, 0, false);
            if (buildingId.startsWith("VL-"))
                return new BuildingConfig(300.0, 20.0, 0, false);
            if ("MB-S2".equals(buildingId))
                return new BuildingConfig(300.0, 20.0, 0, false);
            if ("Hall-1".equals(buildingId))
                return new BuildingConfig(300.0, 40.0, 0, false);
            return new BuildingConfig(150.0, 20.0, 0, false);
        }
    }

    private enum Alignment {
        PERFECT(0, 250.0),
        NEAR_PERFECT(1, 250.0),
        MOSTLY(2, 400.0),
        LOOSE(3, 400.0),
        INVALID(-1, 0);

        final int priority;
        final double maxDist;

        Alignment(int priority, double maxDist) {
            this.priority = priority;
            this.maxDist = maxDist;
        }
    }

    private String currentBuildingId = "Hall-8";
    private final Map<String, Graph<Waypoint, DefaultWeightedEdge>> graphs = new HashMap<>();

    public PathfindingService() {
        for (String id : WAYPOINTS.keySet()) {
            graphs.put(id, buildGraph(id));
        }
    }

    public void setBuilding(String buildingId) {
        this.currentBuildingId = buildingId;
    }
    
    public Waypoint findNearestWaypoint(double x, double y) {
        List<Waypoint> wps = WAYPOINTS.getOrDefault(currentBuildingId, List.of());
        Waypoint nearest = null;
        double minDist = Double.MAX_VALUE;
        for (Waypoint wp : wps) {
            double d = wp.distanceTo(x, y);
            if (d < minDist) {
                minDist = d;
                nearest = wp;
            }
        }
        return nearest;
    }

    public List<Waypoint> findPathThroughWaypoints(Waypoint start, Waypoint end) {
        if (start == null || end == null) return null;

        Graph<Waypoint, DefaultWeightedEdge> graph = graphs.get(currentBuildingId);
        if (graph == null || !graph.containsVertex(start) || !graph.containsVertex(end)) {
            System.err.println("ERROR: Graph missing or vertices not found for " + currentBuildingId);
            return null;
        }

        GraphPath<Waypoint, DefaultWeightedEdge> path =
                new DijkstraShortestPath<>(graph).getPath(start, end);

        if (path == null) {
            System.err.println("ERROR: No path found between waypoints: " + start.id + " -> " + end.id);
            return null;
        }

        return path.getVertexList();
    }

    public List<Waypoint> getAllWaypoints() {
        return new ArrayList<>(WAYPOINTS.getOrDefault(currentBuildingId, List.of()));
    }

    public List<Waypoint> getWaypointsForBuilding(String buildingId) {
        return new ArrayList<>(WAYPOINTS.getOrDefault(buildingId, List.of()));
    }

    public Waypoint findWaypointById(String waypointId) {
        List<Waypoint> wps = WAYPOINTS.getOrDefault(currentBuildingId, List.of());
        for (Waypoint wp : wps) {
            if (wp.id.equals(waypointId)) return wp;
        }
        return null;
    }

    private Graph<Waypoint, DefaultWeightedEdge> buildGraph(String buildingId) {
        SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph =
                new SimpleWeightedGraph<>(DefaultWeightedEdge.class);
        List<Waypoint> waypoints = WAYPOINTS.getOrDefault(buildingId, List.of());
        BuildingConfig config = BuildingConfig.forBuilding(buildingId);

        waypoints.forEach(graph::addVertex);

        for (Waypoint wp : waypoints) {
            addEdgesFor(graph, wp, waypoints, config);
        }

        ensureConnectivity(graph, config);

        return graph;
    }

    /**
     * Add edges from a waypoint to valid neighbors.
     * LB buildings use tiered alignment with max-neighbor limit;
     * other buildings use basic horizontal/vertical alignment.
     */
    private void addEdgesFor(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph,
            Waypoint wp, List<Waypoint> all, BuildingConfig config) {

        record Candidate(Waypoint target, double dist, int priority) {}
        List<Candidate> candidates = new ArrayList<>();

        for (Waypoint other : all) {
            if (wp.equals(other) || graph.containsEdge(wp, other)) continue;

            double dist = wp.distanceTo(other);
            double dx = Math.abs(wp.x - other.x);
            double dy = Math.abs(wp.y - other.y);

            if (config.strictAlignment) {
                Alignment align = classify(dx, dy, config.alignThreshold);
                if (align != Alignment.INVALID && dist <= align.maxDist) {
                    candidates.add(new Candidate(other, dist, align.priority));
                }
            } else {
                if (dist > config.searchRadius) continue;
                boolean horiz = dy <= config.alignThreshold && dx > config.alignThreshold;
                boolean vert = dx <= config.alignThreshold && dy > config.alignThreshold;
                if (horiz || vert) {
                    candidates.add(new Candidate(other, dist, 0));
                }
            }
        }

        candidates.sort(Comparator.comparingInt(Candidate::priority)
                .thenComparingDouble(Candidate::dist));

        int limit = config.maxNeighbors > 0 ? config.maxNeighbors : candidates.size();
        int added = 0;
        for (Candidate c : candidates) {
            if (added >= limit) break;
            if (!graph.containsEdge(wp, c.target)) {
                DefaultWeightedEdge edge = graph.addEdge(wp, c.target);
                if (edge != null) {
                    graph.setEdgeWeight(edge, c.dist);
                    added++;
                }
            }
        }
    }

    private static Alignment classify(double dx, double dy, double strict) {
        if ((dy <= strict && dx > strict) || (dx <= strict && dy > strict))
            return Alignment.PERFECT;
        if ((dy <= 10 && dx > dy * 3 && dx > strict) || (dx <= 10 && dy > dx * 3 && dy > strict))
            return Alignment.NEAR_PERFECT;
        if ((dy <= 25 && dx > dy * 5 && dx > strict) || (dx <= 25 && dy > dx * 5 && dy > strict))
            return Alignment.MOSTLY;
        if ((dy <= 40 && dx > dy * 3 && dx > strict) || (dx <= 40 && dy > dx * 3 && dy > strict))
            return Alignment.LOOSE;
        return Alignment.INVALID;
    }

    private void ensureConnectivity(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph, BuildingConfig config) {

        ConnectivityInspector<Waypoint, DefaultWeightedEdge> inspector =
                new ConnectivityInspector<>(graph);
        List<Set<Waypoint>> components = inspector.connectedSets();
        if (components.size() <= 1) return;

        Set<Waypoint> main = new HashSet<>(components.get(0));
        for (int i = 1; i < components.size(); i++) {
            bridgeComponents(graph, main, components.get(i), config);
            main.addAll(components.get(i));
        }
    }

    private void bridgeComponents(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph,
            Set<Waypoint> comp1, Set<Waypoint> comp2, BuildingConfig config) {

        Waypoint best1 = null, best2 = null;
        double bestDist = Double.MAX_VALUE;
        double maxBridge = config.strictAlignment ? 400.0 : config.searchRadius * 3;

        for (Waypoint a : comp1) {
            for (Waypoint b : comp2) {
                double dist = a.distanceTo(b);
                if (dist > maxBridge || dist >= bestDist) continue;

                double dx = Math.abs(a.x - b.x);
                double dy = Math.abs(a.y - b.y);

                boolean valid;
                if (config.strictAlignment) {
                    valid = classify(dx, dy, config.alignThreshold) != Alignment.INVALID;
                } else {
                    valid = dy <= config.alignThreshold || dx <= config.alignThreshold;
                }

                if (valid) {
                    bestDist = dist;
                    best1 = a;
                    best2 = b;
                }
            }
        }

        if (best1 == null) {
            for (Waypoint a : comp1) {
                for (Waypoint b : comp2) {
                    double d = a.distanceTo(b);
                    if (d < bestDist) {
                        bestDist = d;
                        best1 = a;
                        best2 = b;
                    }
                }
            }
        }

        if (best1 != null && best2 != null && !graph.containsEdge(best1, best2)) {
            DefaultWeightedEdge edge = graph.addEdge(best1, best2);
            if (edge != null) {
                graph.setEdgeWeight(edge, bestDist);
            }
        }
    }
    
    public static class Waypoint {
        public final double x;
        public final double y;
        public final String id;
        
        public Waypoint(double x, double y, String id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
        
        public double distanceTo(Waypoint other) {
            return distanceTo(other.x, other.y);
        }

        public double distanceTo(double ox, double oy) {
            double dx = x - ox;
            double dy = y - oy;
            return Math.sqrt(dx * dx + dy * dy);
        }

        @Override
        public boolean equals(Object o) {
            return this == o || (o instanceof Waypoint w && id.equals(w.id));
        }

        @Override
        public int hashCode() {
            return id.hashCode();
        }

        @Override
        public String toString() {
            return id + "(" + x + ", " + y + ")";
        }
    }
}
