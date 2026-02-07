import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  apiBaseUrl?: string;
};

export default function UpcomingEventButton({ apiBaseUrl }: Props) {
  const SESSION_KEY = "googleSessionId";
  const SELECTED_CALENDAR_KEY = "googleSelectedCalendar";
  const NEXT_EVENT_KEY = "googleNextEvent";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);

  const [calendars, setCalendars] = useState<any[]>([]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const [nextEvent, setNextEvent] = useState<any | null>(null);
  const [eventDetailsText, setEventDetailsText] = useState<string>("");

  const [showEventDetails, setShowEventDetails] = useState(false);
  const [status, setStatus] = useState<string>("");

  // ---------- storage ----------
  const saveSessionId = async (id: string) => AsyncStorage.setItem(SESSION_KEY, id);
  const loadSessionId = async () => AsyncStorage.getItem(SESSION_KEY);
  const clearSessionId = async () => AsyncStorage.removeItem(SESSION_KEY);
  const saveSelectedCalendar = async (calendar: any) =>
    AsyncStorage.setItem(SELECTED_CALENDAR_KEY, JSON.stringify(calendar));
  const loadSelectedCalendar = async () => {
    const raw = await AsyncStorage.getItem(SELECTED_CALENDAR_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const clearSelectedCalendar = async () => AsyncStorage.removeItem(SELECTED_CALENDAR_KEY);
  const saveNextEvent = async (event: any) =>
    AsyncStorage.setItem(NEXT_EVENT_KEY, JSON.stringify(event));
  const loadNextEvent = async () => {
    const raw = await AsyncStorage.getItem(NEXT_EVENT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const clearNextEvent = async () => AsyncStorage.removeItem(NEXT_EVENT_KEY);

  const clearLocalGoogleState = async () => {
    await AsyncStorage.multiRemove([SESSION_KEY, SELECTED_CALENDAR_KEY, NEXT_EVENT_KEY]);
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
      const storedCalendar = await loadSelectedCalendar();
      if (storedCalendar?.id) setSelectedCalendar(storedCalendar);

      if (!stored || !apiBaseUrl) {
        await clearSessionId();
        setSessionId(null);
        await clearNextEvent();
        setNextEvent(null);
        setEventDetailsText("");
        return;
      }

      let sessionValid = false;
      try {
        const sessionCheck = await fetch(`${apiBaseUrl}/api/google/calendars`, {
          headers: { "X-Session-Id": stored },
        });
        sessionValid = sessionCheck.ok;
      } catch {
        sessionValid = false;
      }

      if (!sessionValid) {
        await clearSessionId();
        setSessionId(null);
        await clearNextEvent();
        setNextEvent(null);
        setEventDetailsText("");
        return;
      }

      setSessionId(stored);
      const storedNextEvent = await loadNextEvent();
      if (storedNextEvent) {
        setNextEvent(storedNextEvent);
        setEventDetailsText(formatEventBlock(storedNextEvent));
      } else {
        await clearNextEvent();
      }
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

  const exchangeNewSession = async (): Promise<string> => {
        if (!apiBaseUrl) throw new Error("API_BASE_URL is missing");

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();

        const code =
            (userInfo as any)?.serverAuthCode ??
            (userInfo as any)?.data?.serverAuthCode;

        if (!code) throw new Error("No serverAuthCode returned.");

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


  // ---------- core flow ----------
  const startImportFlow = async (forceCalendarPicker = false) => {
    try {
      if (!apiBaseUrl) throw new Error("API_BASE_URL is missing");

      // 0) Reuse session if possible
      let sid = sessionId ?? (await loadSessionId());

      // 1) If no session, sign in + exchange code
      if (!sid) {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await GoogleSignin.signIn();

        const code =
          (userInfo as any)?.serverAuthCode ??
          (userInfo as any)?.data?.serverAuthCode;

        if (!code) throw new Error("No serverAuthCode returned.");

        const exchangeRes = await fetch(`${apiBaseUrl}/api/google/oauth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serverAuthCode: code }),
        });

        if (!exchangeRes.ok) throw new Error(await exchangeRes.text());

        const exchangeData = await exchangeRes.json();
        sid = exchangeData.sessionId;
        if (!sid) throw new Error("Backend did not return sessionId.");

        setSessionId(sid);
        await saveSessionId(sid);
      } else {
        setSessionId(sid);
      }

      // 2) Fetch calendars
        const fetchCalendars = async (sidToUse: string) => {
            return fetch(`${apiBaseUrl}/api/google/calendars`, {
                headers: { "X-Session-Id": sidToUse },
            });
            };

            let calRes = await fetchCalendars(sid!);

            if (!calRes.ok && (calRes.status === 401 || calRes.status === 403)) {
            // stale session: clear and immediately re-auth in the same click
            await clearSessionId();
            setSessionId(null);

            const newSid = await exchangeNewSession();

            calRes = await fetchCalendars(newSid);
            }

            if (!calRes.ok) {
            throw new Error(await calRes.text());
        }


      const cals = await calRes.json();
      if (!Array.isArray(cals)) throw new Error("Calendars response is not an array.");

      setCalendars(cals);
      const persistedCalendar = selectedCalendar ?? (await loadSelectedCalendar());
      if (!forceCalendarPicker && persistedCalendar?.id) {
        const match = cals.find((c: any) => c?.id === persistedCalendar.id);
        if (match) {
          const hasEvent = await importNextEventFromCalendar(match);
          if (!hasEvent) {
            setShowCalendarPicker(true);
          }
          return;
        }
        await clearSelectedCalendar();
        setSelectedCalendar(null);
      }

      setShowCalendarPicker(true);
    } catch (e: any) {
      console.log("IMPORT FLOW ERROR:", e);
      setStatus(e?.message ?? String(e));
    }
  };

  const importNextEventFromCalendar = async (calendar: any): Promise<boolean> => {
    try {
      if (!apiBaseUrl) throw new Error("API_BASE_URL is missing");
      let sid = sessionId ?? (await loadSessionId());
      if (!sid) throw new Error("Missing sessionId. Please sign in again.");
      if (!calendar?.id) throw new Error("Missing calendar id.");

      const fetchNextEvent = async (sidToUse: string) => {
        const url =
          `${apiBaseUrl}/api/google/calendars/${encodeURIComponent(calendar.id)}/next-event` +
          `?days=7&timeZone=${encodeURIComponent("America/Montreal")}`;
        return fetch(url, {
          method: "GET",
          headers: { "X-Session-Id": sidToUse },
        });
      };

      let impRes = await fetchNextEvent(sid);

      if (!impRes.ok && (impRes.status === 401 || impRes.status === 403)) {
        await clearSessionId();
        setSessionId(null);
        sid = await exchangeNewSession();
        impRes = await fetchNextEvent(sid);
      }

      if (impRes.status === 204) {
        setNextEvent(null);
        setEventDetailsText("No upcoming events found in the next 7 days.");
        setStatus("No upcoming event");
        await clearNextEvent();
        return false;
      }

      if (!impRes.ok) {
        const t = await impRes.text();
        if (impRes.status === 404) {
          await clearSelectedCalendar();
          setSelectedCalendar(null);
          await clearNextEvent();
          setNextEvent(null);
        }
        throw new Error(t);
      }

      const next = await impRes.json();
      if (!next || typeof next !== "object") {
        setNextEvent(null);
        setEventDetailsText("No upcoming events found in the next 7 days.");
        setStatus("No upcoming event");
        await clearNextEvent();
        return false;
      }

      setNextEvent(next);
      setEventDetailsText(formatEventBlock(next));
      setStatus("Imported");
      await saveNextEvent(next);
      return true;

    } catch (e: any) {
      console.log("IMPORT EVENTS ERROR:", e);
      setStatus(e?.message ?? String(e));
      return false;
    }
  };

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
      setStatus("Logged out (testing)");
    } catch (e: any) {
      setStatus(e?.message ?? String(e));
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
        <TouchableOpacity style={styles.primaryBtn} onPress={() => { void startImportFlow(); }}>
          <Text style={styles.primaryBtnText}>Import schedule from Google Calendar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.upcomingBtn} onPress={() => setShowEventDetails(true)}>
          <Text style={styles.upcomingBtnText}>Upcoming event: {upcomingTitle}</Text>
        </TouchableOpacity>
      )}

      {/* optional status line */}
      {!!status && <Text style={styles.status}>{status}</Text>}

      {/* Calendar picker modal */}
      <Modal visible={showCalendarPicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a calendar</Text>

            <FlatList
              data={calendars}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.calendarRow}
                  onPress={async () => {
                    setShowCalendarPicker(false);
                    setSelectedCalendar(item);
                    await saveSelectedCalendar(item);
                    await importNextEventFromCalendar(item);
                  }}
                >
                  <Text style={styles.calendarName}>{item.summary}</Text>
                  {item.primary ? <Text style={styles.calendarMeta}>Primary</Text> : null}
                </TouchableOpacity>
              )}
            />

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
              <TouchableOpacity
                style={styles.detailsCloseBtn}
                onPress={() => setShowEventDetails(false)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={styles.detailsCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.detailsTitle}>{upcomingTitle}</Text>
            <Text style={styles.detailsBody}>{eventDetailsText}</Text>

            <View style={{ height: 12 }} />
            <Button title="Change calendar" onPress={changeCalendarFromDetails} />
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

  status: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.8,
    textAlign: "center",
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
    alignItems: "flex-end",
    marginBottom: 4,
  },
  detailsCloseBtn: {
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
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  detailsBody: {
    fontSize: 14,
    lineHeight: 20,
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
