import type { Coordinate } from "../type";

export interface PoiDetails {
  id: string;
  name: string;
  address?: string;
  location: Coordinate;
  rating?: number;
  openingHours?: any;
  phoneNumber?: string;
  distanceKm?: string;
  distance?: number;
}
