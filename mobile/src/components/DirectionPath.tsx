import React, {useEffect, useState} from 'react';
import {Polyline, Marker} from 'react-native-maps';
import polyline from "@mapbox/polyline";
import {Coordinate} from "../type";
import useNavigationConfig from "../hooks/useNavigationConfig";
import {useMemo} from "react";
import useNavigationInfo from "../hooks/useNavigationInfo";
import {API_BASE_URL} from "../const";

interface DirectionPathProps {
    origin: Coordinate | null;
    destination: Coordinate | null;
}

export default function DirectionPath({origin, destination}: DirectionPathProps) {
    const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
    const {navigationMode} = useNavigationConfig();
    const {setPathDistance, setPathDuration, setIsLoading} = useNavigationInfo();

    const directionsMode = useMemo(() => {
        switch (navigationMode) {
            case "BUS":
                return "transit";
            case "WALK":
                return "walking";
            case "BIKE":
                return "bicycling";
            case "SHUTTLE":
                return "transit";
            default:
                return "driving";
        }
    }, [navigationMode]);

    useEffect(() => {
        const getRoute = async () => {
            setIsLoading(true);
            try {
                const originStr = `${origin!.latitude},${origin!.longitude}`;
                const destinationStr = `${destination!.latitude},${destination!.longitude}`;
                const rawOutdoorDirectionResponse = await fetch(
                    `${API_BASE_URL}/api/directions/outdoor` +
                    `?origin=${encodeURIComponent(originStr)}` +
                    `&destination=${encodeURIComponent(destinationStr)}` +
                    `&transportMode=${directionsMode}`
                );
                const outdoorDirection = await rawOutdoorDirectionResponse.json();

                if (!outdoorDirection.polyline) {
                    console.log("No polyline returned");
                    console.log(outdoorDirection)
                    return;
                }


                let allCoordinates: Coordinate[] = [];

                // See @backend/service/GoogleMapsService.java
                if (outdoorDirection.steps) {
                    outdoorDirection.steps.forEach((step: any) => {
                        // Decode the polyline for this specific step
                        const stepPoints = polyline.decode(step.polyline);

                        const stepCoords = stepPoints.map((point: number[]) => ({
                            latitude: point[0],
                            longitude: point[1]
                        }));
                        allCoordinates = [...allCoordinates, ...stepCoords];
                    });
                } else if (outdoorDirection.polyline) {
                    // Fallback to overview if steps are missing
                    const points = polyline.decode(outdoorDirection.polyline);
                    allCoordinates = points.map(point => ({ latitude: point[0], longitude: point[1] }));
                }

                setRouteCoords(allCoordinates);

                if (outdoorDirection.distance !== undefined) {
                    setPathDistance(outdoorDirection.distance);
                }
                if (outdoorDirection.duration !== undefined) {
                    setPathDuration(outdoorDirection.duration);
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            } finally {
                setIsLoading(false);
            }

        };
        getRoute();
    }, [origin, destination, directionsMode, setPathDistance, setPathDuration]);

    return (
        <>
            <Polyline
                coordinates={routeCoords}
                strokeWidth={3}
                strokeColor="red"
            />
        </>
    );
}