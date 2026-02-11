import React, {useEffect, useState} from 'react';
import {Polyline, Marker} from 'react-native-maps';
import polyline from "@mapbox/polyline";
import {Coordinate} from "../type";
import useNavigationConfig from "../hooks/useNavigationConfig";
import {useMemo} from "react";
import useNavigationInfo from "../hooks/useNavigationInfo";
import {API_BASE_URL} from "../const";

interface DirectionPathProps {
    origin: Coordinate;
    destination: Coordinate;
}

export default function DirectionPath({origin, destination}: DirectionPathProps) {
    const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
    const {navigationMode} = useNavigationConfig();
    const {setPathDistance, setPathDuration} = useNavigationInfo();

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
            try {
                const originStr = `${origin.latitude},${origin.longitude}`;
                const destinationStr = `${destination.latitude},${destination.longitude}`;
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

                const routePoints = polyline.decode(outdoorDirection.polyline);
                const routePointsCoordinates = routePoints.map(point => ({
                    latitude: point[0],
                    longitude: point[1]
                }));

                setRouteCoords(routePointsCoordinates);

                // Set distance and duration if available
                if (outdoorDirection.distance !== undefined) {
                    setPathDistance(outdoorDirection.distance);
                }
                if (outdoorDirection.duration !== undefined) {
                    setPathDuration(outdoorDirection.duration);
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            }
        };
        getRoute();
    }, [origin, destination, directionsMode, setPathDistance, setPathDuration]);

    if (routeCoords.length === 0) {
        return null;
    }

    return (
        <>
            <Polyline
                coordinates={routeCoords}
                strokeWidth={3}
                strokeColor="red"
            />
            <Marker coordinate={routeCoords[0]}/>
            <Marker coordinate={routeCoords[1]}/>
        </>
    );
}