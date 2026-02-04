export type BuildingId = "FB" | "EV" | "LB";
export type LatLng = { latitude: number; longitude: number };

export type Building = {
  id: BuildingId;
  name: string;
  marker: LatLng;
  polygon: LatLng[];
  addressLines: string[];
};

export const BUILDINGS: Building[] = [
  {
    id: "FB",
    name: "Faubourg Building",
    marker: { latitude: 45.49472, longitude: -73.57772 },
    addressLines: ["1250 Guy St. (main entrance)", "Catherine St. W."],
    polygon: [
      { latitude: 45.494907593260784, longitude: -73.57778184874842 },
      { latitude: 45.49451110096495, longitude: -73.57825550609759 },
      { latitude: 45.494282230157545, longitude: -73.57787841966426 },
      { latitude: 45.494733523816116, longitude: -73.5773725720098 },
    ],
  },
  {
    id: "EV",
    name: "Engineering, Computer Scienece and Visual Arts Integreated Complex",
    marker: { latitude: 45.49539, longitude: -73.57799 },
    addressLines: ["1600 Ste-Catherine St. W."],
    polygon: [
      { latitude: 45.49586696917776, longitude: -73.57849767209156 },
      { latitude: 45.495447845458415, longitude: -73.57761175921861 },
      { latitude: 45.4951955080872, longitude: -73.57790501481942 },
      { latitude: 45.495595554611526, longitude: -73.57876370936708 },
    ],
  },
  {
    id: "LB",
    name: "Webster Library",
    marker: { latitude: 45.496798007653645, longitude: -73.57803724265663 },
    addressLines: ["1400 De Maisonneuve Blvs. W."],
    polygon: [
      { latitude: 45.49725895125797, longitude: -73.57805793642433 },
      { latitude: 45.49669002381621, longitude: -73.57860747092167 },
      { latitude: 45.49632255487784, longitude: -73.57784180151741 },
      { latitude: 45.49689470942183, longitude: -73.57728996771255 },
    ],
  },
];
