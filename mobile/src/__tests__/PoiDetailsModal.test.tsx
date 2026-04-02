import { describe, it, expect, jest } from "@jest/globals";
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PoiDetailsModal from "../components/PoiDetailsModal";

describe("PoiDetailsModal", () => {
  const poi = {
    id: "poi-1",
    name: "Test Cafe",
    address: "123 Test St",
    location: { latitude: 45.5, longitude: -73.6 },
    rating: 4.2,
    openingHours: {
      openNow: true,
      weekdayDescriptions: ["Mon: 9am - 5pm", "Tue: 9am - 5pm"],
    },
    phoneNumber: "555-1234",
    distanceKm: "0.3",
  };

  it("renders POI details when visible and poi is provided", () => {
    const { getByText } = render(
      <PoiDetailsModal
        visible
        poi={poi}
        onClose={jest.fn()}
        onGetDirections={jest.fn()}
      />,
    );

    expect(getByText("Test Cafe")).toBeTruthy();
    expect(getByText("Address")).toBeTruthy();
    expect(getByText("123 Test St")).toBeTruthy();
    expect(getByText("Distance")).toBeTruthy();
    expect(getByText("0.3 km away")).toBeTruthy();
    expect(getByText("Rating")).toBeTruthy();
    expect(getByText("4.2 / 5.0")).toBeTruthy();
    expect(getByText("Phone Number")).toBeTruthy();
    expect(getByText("555-1234")).toBeTruthy();
    expect(getByText("Opening Hours")).toBeTruthy();
  });

  it("does not render when poi is null", () => {
    const { queryByText } = render(
      <PoiDetailsModal
        visible
        poi={null}
        onClose={jest.fn()}
        onGetDirections={jest.fn()}
      />,
    );

    expect(queryByText("Test Cafe")).toBeNull();
    expect(queryByText("Get Directions")).toBeNull();
  });

  it("calls onClose when the backdrop is pressed", () => {
    const onClose = jest.fn();

    const { getByTestId } = render(
      <PoiDetailsModal
        visible
        poi={poi}
        onClose={onClose}
        onGetDirections={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId("details-modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onGetDirections when Get Directions is pressed", () => {
    const onGetDirections = jest.fn();

    const { getByText } = render(
      <PoiDetailsModal
        visible
        poi={poi}
        onClose={jest.fn()}
        onGetDirections={onGetDirections}
      />,
    );

    fireEvent.press(getByText("Get Directions"));

    expect(onGetDirections).toHaveBeenCalledWith({
      latitude: 45.5,
      longitude: -73.6,
      name: "Test Cafe",
    });
  });

  it("toggles opening hours details when the toggle is pressed", () => {
    const { getByTestId, queryByText } = render(
      <PoiDetailsModal
        visible
        poi={poi}
        onClose={jest.fn()}
        onGetDirections={jest.fn()}
      />,
    );

    expect(queryByText("Mon: 9am - 5pm")).toBeNull();

    fireEvent.press(getByTestId("opening-hours-toggle"));

    expect(queryByText("Mon: 9am - 5pm")).toBeTruthy();
  });
});
