import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  apiBaseUrl?: string;
};

export default function UpcomingEventButton({ apiBaseUrl }: Props) {
  const SESSION_KEY = "googleSessionId";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);

  const [calendars, setCalendars] = useState<any[]>([]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  const [nextEvent, setNextEvent] = useState<any | null>(null);
  const [eventDetailsText, setEventDetailsText] = useState<string>("");

  const [showEventDetails, setShowEventDetails] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  // ---------- storage ----------
  const saveSessionId = async (id: string) => AsyncStorage.setItem(SESSION_KEY, id);
  const loadSessionId = async () => AsyncStorage.getItem(SESSION_KEY);
  const clearSessionId = async () => AsyncStorage.removeItem(SESSION_KEY);

  const clearLocalGoogleState = async () => {
    await AsyncStorage.multiRemove([SESSION_KEY, "googleSelectedCalendar", "googleNextEvent"]);
    setSessionId(null);
    setSelectedCalendar(null);
    setCalendars([]);
    setShowCalendarPicker(false);
    setNextEvent(null);
    setEventDetailsText("");
    setShowEventDetails(false);
  };

  // ---------- Google sign-in config ----------
  useEffect(() => {
    GoogleSignin.configure({
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      webClientId: "511345858617-6dd93pjirlhn1k82scnvs9ovcpopd81u.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  // load stored session once
  useEffect(() => {
    (async () => {
      const googleUser = GoogleSignin.getCurrentUser();
      if (!googleUser) {
        await clearLocalGoogleState();
        return;
      }

      const stored = await loadSessionId();
      if (!stored || !apiBaseUrl) {
        await clearSessionId();
        setSessionId(null);
        setSelectedCalendar(null);
        setNextEvent(null);
        setEventDetailsText("");
        return;
      }

      await refreshState(stored, false);
    })();
  }, [apiBaseUrl]);

  // ---------- formatting helpers ----------
  const TZ = "America/Montreal";

  const dayFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    weekday: "short",
  });

  const timeFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function parseBuildingAndRoom(locationRaw?: string) {
    const location = (locationRaw ?? "").trim();
    if (!location) return { campus: "(no campus)", building: "(no building)", room: "(missing)" };

    // "Rm 607" / "Rm S2.330"
    const rmMatch = location.match(/\bRm\.?\s*([A-Za-z0-9.\-]+)\b/i);
    if (rmMatch) {
      const room = rmMatch[1].trim();
      let buildingLine = location.replace(rmMatch[0], "").trim();

      // Split "Campus - Building" into separate lines
      let campus = "(no campus)";
      let building = buildingLine;

      if (buildingLine.includes(" - ")) {
        const [c, ...rest] = buildingLine.split(" - ");
        campus = c.trim();
        building = rest.join(" - ").trim() || "(no building)";
      }

      return { campus, building, room: room || "(missing)" };
    }

    // "Classroom:H937"
    const classroomMatch = location.match(/Classroom:\s*([A-Za-z0-9.\-]+)/i);
    if (classroomMatch) {
      const room = classroomMatch[1].trim();
      return { campus: "(no campus)", building: "(no building)", room: room || "(missing)" };
    }

    // Fallback
    return { campus: "(no campus)", building: location, room: "(missing)" };
  }

  function formatWhen(ev: any) {
    if (ev.allDay) return "All day";

    const start = ev.start ? new Date(ev.start) : null;
    const end = ev.end ? new Date(ev.end) : null;
    if (!start || !end) return "(missing time)";

    const day = dayFmt.format(start);
    const startT = timeFmt.format(start);
    const endT = timeFmt.format(end);

    return `${day}, ${startT} - ${endT}`;
  }

  function formatEventBlock(ev: any) {
    const { campus, building, room } = parseBuildingAndRoom(ev.location);
    const when = formatWhen(ev);

    // key-value pairing for classroom (you asked for this style)
    return `${campus}\n${building}\nClassroom: ${room}\n${when}`;
  }

  const exchangeNewSession = async (options?: { showPickerAfterSignIn?: boolean }): Promise<string> => {
        if (!apiBaseUrl) throw new Error("API_BASE_URL is missing");

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();

        const code =
            (userInfo as any)?.serverAuthCode ??
            (userInfo as any)?.data?.serverAuthCode;

        if (!code) throw new Error("No serverAuthCode returned.");

        if (options?.showPickerAfterSignIn) {
          setCalendars([]);
          setShowCalendarPicker(true);
          setIsCalendarLoading(true);
        }

        const exchangeRes = await fetch(`${apiBaseUrl}/api/google/oauth/exchange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serverAuthCode: code }),
        });

        if (!exchangeRes.ok) throw new Error(await exchangeRes.text());

        const exchangeData = await exchangeRes.json();
        const sid = exchangeData.sessionId;
        if (!sid) throw new Error("Backend did not return sessionId.");

        setSessionId(sid);
        await saveSessionId(sid);
        return sid;
    };

  const ensureSessionId = async (showPickerAfterSignIn = false): Promise<string> => {
    let sid = sessionId ?? (await loadSessionId());
    if (sid) {
      setSessionId(sid);
      return sid;
    }
    sid = await exchangeNewSession({ showPickerAfterSignIn });
    return sid;
  };

  const refreshState = async (
    preferredSessionId?: string,
    allowReauth = false,
    includeCalendars = false
  ): Promise<any | null> => {
    if (!apiBaseUrl) return null;

    let sid = preferredSessionId ?? sessionId ?? (await loadSessionId());
    if (!sid) return null;

    const fetchState = async (sidToUse: string) =>
      fetch(
        `${apiBaseUrl}/api/google/state?days=7&timeZone=${encodeURIComponent("America/Montreal")}&includeCalendars=${includeCalendars}`,
        { headers: { "X-Session-Id": sidToUse } }
      );

    try {
      let stateRes = await fetchState(sid);

      if (!stateRes.ok && (stateRes.status === 401 || stateRes.status === 403)) {
        await clearSessionId();
        setSessionId(null);

        if (!allowReauth) {
          setSelectedCalendar(null);
          setNextEvent(null);
          setEventDetailsText("");
          return null;
        }

        sid = await exchangeNewSession();
        stateRes = await fetchState(sid);
      }

      if (!stateRes.ok) {
        throw new Error(await stateRes.text());
      }

      const state = await stateRes.json();
      setSessionId(sid);
      await saveSessionId(sid);

      const selected = state?.selectedCalendar && state.selectedCalendar.id ? state.selectedCalendar : null;
      setSelectedCalendar(selected);

      if (state?.nextEvent && typeof state.nextEvent === "object") {
        setNextEvent(state.nextEvent);
        setEventDetailsText(formatEventBlock(state.nextEvent));
      } else {
        setNextEvent(null);
        setEventDetailsText("No upcoming events found in the next 7 days.");
      }

      return state;
    } catch (e: any) {
      console.log("STATE REFRESH ERROR:", e);
      return null;
    }
  };


  // ---------- core flow ----------
  const startImportFlow = async (forceCalendarPicker = false) => {
    setIsBusy(true);
    try {
      if (!apiBaseUrl) throw new Error("API_BASE_URL is missing");

      const sid = await ensureSessionId(true);
      let sidToUse = sid;

      const fetchCalendarsDirect = async (sessionToUse: string): Promise<any[]> => {
        const res = await fetch(`${apiBaseUrl}/api/google/calendars`, {
          headers: { "X-Session-Id": sessionToUse },
        });

        if (!res.ok && (res.status === 401 || res.status === 403)) {
          await clearSessionId();
          setSessionId(null);
          sidToUse = await exchangeNewSession();
          const retry = await fetch(`${apiBaseUrl}/api/google/calendars`, {
            headers: { "X-Session-Id": sidToUse },
          });
          if (!retry.ok) throw new Error(await retry.text());
          const retryCalendars = await retry.json();
          return Array.isArray(retryCalendars) ? retryCalendars : [];
        }

        if (!res.ok) throw new Error(await res.text());
        const cals = await res.json();
        return Array.isArray(cals) ? cals : [];
      };

      if (!forceCalendarPicker) {
        const state = await refreshState(sidToUse, true, false);
        if (state?.calendarSelected) {
          setShowCalendarPicker(false);
          return;
        }
      }

      if (!showCalendarPicker) {
        setCalendars([]);
        setShowCalendarPicker(true);
        setIsCalendarLoading(true);
      }

      const directCalendars = await fetchCalendarsDirect(sidToUse);
      setCalendars(directCalendars);
    } catch (e: any) {
      console.log("IMPORT FLOW ERROR:", e);
    } finally {
      setIsCalendarLoading(false);
      setIsBusy(false);
    }
  };

  const selectCalendarAndRefresh = async (calendar: any): Promise<boolean> => {
    setIsBusy(true);
    try {
      if (!apiBaseUrl) throw new Error("API_BASE_URL is missing");
      let sid = sessionId ?? (await loadSessionId());
      if (!sid) throw new Error("Missing sessionId. Please sign in again.");
      if (!calendar?.id) throw new Error("Missing calendar id.");

      const saveSelection = async (sidToUse: string) => {
        return fetch(url, {
          method: "PUT",
          headers: {
            "X-Session-Id": sidToUse,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: calendar.id,
            summary: calendar.summary,
            primary: !!calendar.primary,
          }),
        });
      };

      const url = `${apiBaseUrl}/api/google/selected-calendar`;
      let setRes = await saveSelection(sid);

      if (!setRes.ok && (setRes.status === 401 || setRes.status === 403)) {
        await clearSessionId();
        setSessionId(null);
        sid = await exchangeNewSession();
        setRes = await saveSelection(sid);
      }

      if (!setRes.ok) {
        throw new Error(await setRes.text());
      }

      const state = await refreshState(sid, true);
      return !!state?.calendarSelected;

    } catch (e: any) {
      console.log("SELECT CALENDAR ERROR:", e);
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (!selectedCalendar?.id || !sessionId || !apiBaseUrl) {
      return;
    }

    const intervalId = setInterval(() => {
      if (AppState.currentState === "active") {
        void refreshState(sessionId, false);
      }
    }, 60_000);

    const appStateSub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        void refreshState(sessionId, false);
      }
    });

    return () => {
      clearInterval(intervalId);
      appStateSub.remove();
    };
  }, [selectedCalendar?.id, sessionId, apiBaseUrl]);

  const changeCalendarFromDetails = async () => {
    setShowEventDetails(false);
    await startImportFlow(true);
  };

  const logoutGoogleForTesting = async () => {
    try {
      await clearLocalGoogleState();
      try {
        await GoogleSignin.revokeAccess();
      } catch {}
      try {
        await GoogleSignin.signOut();
      } catch {}
    } catch (e: any) {
      console.log("LOGOUT ERROR:", e);
    }
  };

  // ---------- UI behavior ----------
  const hasSelectedCalendarSession = !!selectedCalendar && !!sessionId;
  const showRedEventButton = hasSelectedCalendarSession;
  const upcomingTitle = nextEvent
    ? ((nextEvent?.summary ?? "").trim() || "Upcoming event")
    : "No event in calendar";

  return (
    <View style={{ width: "100%" }}>
      {/* Main button */}
      {!showRedEventButton ? (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => { if (!isBusy) void startImportFlow(); }}
        >
          <Text style={styles.primaryBtnText}>Import schedule from Google Calendar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.upcomingBtn} onPress={() => setShowEventDetails(true)}>
          <Text style={styles.upcomingBtnText}>Upcoming event: {upcomingTitle}</Text>
        </TouchableOpacity>
      )}

      {/* Calendar picker modal */}
      <Modal visible={showCalendarPicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a calendar</Text>

            {isCalendarLoading ? (
              <View style={styles.calendarLoadingBox}>
                <ActivityIndicator size="small" color="#1976d2" />
                <Text style={styles.calendarLoadingText}>Refreshing calendars...</Text>
              </View>
            ) : (
              <FlatList
                data={calendars}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.calendarRow}
                    onPress={async () => {
                      setShowCalendarPicker(false);
                      await selectCalendarAndRefresh(item);
                    }}
                  >
                    <Text style={styles.calendarName}>{item.summary}</Text>
                    {item.primary ? <Text style={styles.calendarMeta}>Primary</Text> : null}
                  </TouchableOpacity>
                )}
              />
            )}

            <View style={{ height: 12 }} />
            <Button title="Cancel" onPress={() => setShowCalendarPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Event details modal (big box) */}
      <Modal visible={showEventDetails} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{upcomingTitle}</Text>
              <TouchableOpacity
                style={styles.detailsCloseBtn}
                onPress={() => setShowEventDetails(false)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={styles.detailsCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailsBody}>{eventDetailsText}</Text>

            <View style={{ height: 12 }} />
            <TouchableOpacity style={styles.changeCalendarBtn} onPress={changeCalendarFromDetails}>
              <Text style={styles.changeCalendarBtnText}>Change calendar</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.logoutBtn} onPress={logoutGoogleForTesting}>
              <Text style={styles.logoutBtnText}>Log out of Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#1976d2",
    alignItems: "center",
    width: "100%",
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  upcomingBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#c62828",
    backgroundColor: "white",
    alignItems: "center",
    width: "100%",
  },
  upcomingBtnText: {
    color: "#c62828",
    fontWeight: "700",
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  calendarLoadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  calendarLoadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#555",
  },
  calendarRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  calendarName: {
    fontSize: 16,
  },
  calendarMeta: {
    fontSize: 12,
    opacity: 0.7,
  },

  detailsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  detailsHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailsCloseBtn: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsCloseText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#444",
  },
  detailsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
  },
  detailsBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  changeCalendarBtn: {
    backgroundColor: "#1976d2",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  changeCalendarBtnText: {
    color: "white",
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "#c62828",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "white",
    fontWeight: "700",
  },
});
