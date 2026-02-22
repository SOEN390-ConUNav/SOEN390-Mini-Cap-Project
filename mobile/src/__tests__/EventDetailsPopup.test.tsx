import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import EventDetailsPopup from "../components/EventDetailsPopup";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, null, `ion-${name}`),
  };
});

jest.mock("@expo/vector-icons/FontAwesome5", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      React.createElement(Text, null, `fa-${name}`),
  };
});

jest.mock("@expo/vector-icons/FontAwesome", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      React.createElement(Text, null, `fa-solid-${name}`),
  };
});

jest.mock("@expo/vector-icons/Foundation", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      React.createElement(Text, null, `foundation-${name}`),
  };
});

describe("EventDetailsPopup", () => {
  it("renders nothing when not visible", () => {
    render(
      <EventDetailsPopup
        visible={false}
        title="SOEN 390"
        detailsText="SGW"
        onClose={jest.fn()}
        onDirections={jest.fn()}
        onChangeCalendar={jest.fn()}
        onLogout={jest.fn()}
      />,
    );

    expect(screen.queryByText("SOEN 390")).toBeNull();
  });

  it("renders content and triggers all actions", () => {
    const onClose = jest.fn();
    const onDirections = jest.fn();
    const onChangeCalendar = jest.fn();
    const onLogout = jest.fn();

    const view = render(
      <EventDetailsPopup
        visible
        title="SOEN 390"
        detailsText="SGW - Hall - H-937"
        onClose={onClose}
        onDirections={onDirections}
        onChangeCalendar={onChangeCalendar}
        onLogout={onLogout}
      />,
    );

    expect(screen.getByText("SOEN 390")).toBeTruthy();
    expect(screen.getByText("SGW - Hall - H-937")).toBeTruthy();

    fireEvent.press(screen.getByText("ion-close"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Directions"));
    expect(onDirections).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Change calendar"));
    expect(onChangeCalendar).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Log out of Google"));
    expect(onLogout).toHaveBeenCalledTimes(1);

    const pressables = view.root.findAll(
      (node: any) => typeof node?.props?.onPress === "function",
    );
    const stopPropagation = jest.fn();
    for (const node of pressables) {
      node.props.onPress({ stopPropagation });
      if (stopPropagation.mock.calls.length > 0) {
        break;
      }
    }
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("hides directions button when showDirections is false", () => {
    render(
      <EventDetailsPopup
        visible
        title="No upcoming event"
        detailsText="No upcoming event"
        showDirections={false}
        onClose={jest.fn()}
        onDirections={jest.fn()}
        onChangeCalendar={jest.fn()}
        onLogout={jest.fn()}
      />,
    );

    expect(screen.queryByText("Directions")).toBeNull();
  });

  it("renders accessibility icons when accessibility data is provided", () => {
    render(
      <EventDetailsPopup
        visible
        title="SOEN 390"
        detailsText="SGW - Hall - H-937"
        accessibility={{
          hasElevator: true,
          hasParking: true,
          isAccessible: true,
        }}
        onClose={jest.fn()}
        onDirections={jest.fn()}
        onChangeCalendar={jest.fn()}
        onLogout={jest.fn()}
      />,
    );

    expect(screen.getByText("P")).toBeTruthy();
    expect(screen.getByText("foundation-elevator")).toBeTruthy();
    expect(screen.getByText("fa-solid-wheelchair")).toBeTruthy();
  });
});
