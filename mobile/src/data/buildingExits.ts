import { BuildingId } from "./buildings";

export type BuildingExitRoom = {
  floor: string;
  room: string;
};

export const BUILDING_EXIT_ROOMS: Partial<
  Record<BuildingId, BuildingExitRoom>
> = {
  H: { floor: "1", room: "H1-Maisonneuve-Entry" },
  LB: { floor: "2", room: "LB2-Emergency-Exit-1" },
  MB: { floor: "1", room: "MB1-Main-Entrance" },
  VL: { floor: "1", room: "VL-101" },
  VE: { floor: "1", room: "VE1-Entrance/exit" },
  CC: { floor: "1", room: "CC-Entrance-Exit" },
};
