import { useState } from "react";

import { Coordinate } from "../type";

export function useDistanceFilter() {
  const [maxDistance, setMaxDistance] = useState<number>(5000);
  const [distanceFilterVisible, setDistanceFilterVisible] = useState(false);

  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [customDistance, setCustomDistance] = useState<string>("5");

  const [selectedLocationDetail, setSelectedLocationDetail] =
    useState<any>(null);
  const [locationDetailVisible, setLocationDetailVisible] = useState(false);
  const [showHours, setShowHours] = useState(false);

  return {
    distance: {
      maxDistance,
      setMaxDistance,
      customDistance,
      setCustomDistance,
      distanceFilterVisible,
      setDistanceFilterVisible,
    },

    location: {
      userLocation,
      setUserLocation,
      selectedLocationDetail,
      setSelectedLocationDetail,
      locationDetailVisible,
      setLocationDetailVisible,
    },

    hours: {
      showHours,
      setShowHours,
    },
  };
}
