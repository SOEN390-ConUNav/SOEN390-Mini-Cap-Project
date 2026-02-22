import Constants from "expo-constants";

export const NAVIGATION_STATE = {
  IDLE: "IDLE",
  SEARCHING: "SEARCHING",
  ROUTE_CONFIGURING: "ROUTE_CONFIGURING",
  NAVIGATING: "NAVIGATING",
} as const;
export const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.googleMapsApiKey;
export const API_BASE_URL = (Constants.expoConfig?.extra as any)?.API_BASE_URL;
