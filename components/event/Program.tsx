import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Button,
  Linking,
  Alert,
} from "react-native";
import { Text, ActivityIndicator, Chip, IconButton } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { searchAgendas } from "@/services/api/agendaService";
import { fetchSpeakers, searchSpeakers } from "@/services/api/speakerService";

import { buildCalendarLayout, PX_PER_MIN } from "@/app/utils/CalendarLayout";

export default function Program() {
  const { eventId } = useLocalSearchParams();

  const [selectedDay, setSelectedDay] = useState<string>("");
  const [agenda, setAgenda] = useState<{ [key: string]: any[] }>({});
  const [days, setDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterRoom, setFilterRoom] = useState<string>("");
  const [filterModule, setFilterModule] = useState<string>("");
  const [rooms, setRooms] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showModulePicker, setShowModulePicker] = useState(false);

  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const [calendarWidth, setCalendarWidth] = useState(0);

  // ✅ Indice global: speakerId -> speakerName
  const [speakerIndex, setSpeakerIndex] = useState<Record<string, string>>({});
  const [showSpecialNotice, setShowSpecialNotice] = useState(true);

  const buildSpeakerIndexFromList = (list: any[] = []) => {
    const idx: Record<string, string> = {};
    (list || []).forEach((sp: any) => {
      const id = getId(sp); // ✅
      const name = String(sp?.names || sp?.name || "").trim();
      if (id && name) idx[id] = name;
    });
    return idx;
  };

  const getId = (x: any): string => {
    if (!x) return "";

    // string directo
    if (typeof x === "string") return x;

    // Mongo export: { $oid: "..." }
    if (x.$oid && typeof x.$oid === "string") return x.$oid;

    // { _id: "..." }
    if (typeof x._id === "string") return x._id;

    // { _id: { $oid: "..." } }
    if (x._id?.$oid && typeof x._id.$oid === "string") return x._id.$oid;

    // { speakerId: "..." } o { speakerId: { $oid: "..." } }
    if (typeof x.speakerId === "string") return x.speakerId;
    if (x.speakerId?.$oid && typeof x.speakerId.$oid === "string")
      return x.speakerId.$oid;

    return "";
  };

  // =========================================================
  // Helpers: speakers (objeto o id)
  // =========================================================
  const getSpeakerNames = (speakers: any[] = []) => {
    const names = (speakers || [])
      .map((s: any) => {
        if (!s) return "";

        // ✅ si viene como string id
        if (typeof s === "string") return speakerIndex[s] || "";

        // ✅ si viene populate normal
        if (s.names) return String(s.names);
        if (s.name) return String(s.name);
        if (s.speakerId?.names) return String(s.speakerId.names);

        // ✅ fallback por _id del objeto
        const id = s._id ? String(s._id) : "";
        return id ? speakerIndex[id] || "" : "";
      })
      .filter(Boolean)
      .join(", ");

    return names.trim();
  };

  // =========================================================
  // Normalizador: solo asegurar subSessions array
  // (NO creamos fallback fake)
  // =========================================================
  const normalizeSession = (session: any) => ({
    ...session,
    subSessions: Array.isArray(session?.subSessions) ? session.subSessions : [],
  });

  // =========================================================
  // Fetch agenda + speakers
  // =========================================================
  const fetchAgenda = async () => {
    try {
      setLoading(true);

      // ✅ 1) Cargar speakers primero (para resolver IDs en subSessions)
      let speakersList: any[] = [];
      try {
        if (eventId) {
          const spRes = await searchSpeakers({ eventId });
          speakersList =
            spRes?.data?.items || spRes?.data || spRes?.items || [];
        } else {
          const spRes = await fetchSpeakers();
          speakersList =
            spRes?.data?.items || spRes?.data || spRes?.items || [];
        }
      } catch (e) {
        console.log("⚠️ No se pudo cargar speakers, continuo igual:", e);
      }

      const idx = buildSpeakerIndexFromList(speakersList);
      setSpeakerIndex(idx);
      console.log("✅ SPEAKER INDEX =>", idx);

      // ✅ 2) Cargar agenda
      const filters = { eventId: eventId };
      const response = await searchAgendas(filters);

      if (!response || response?.message === "No se encontraron agendas") {
        setAgenda({});
        setDays([]);
        setSelectedDay("");
        return;
      }

      const agendaItems = response?.data?.items || [];
      const allSessionsRaw = agendaItems.flatMap((a: any) => a?.sessions || []);

      const sessions = allSessionsRaw.map(normalizeSession);

      console.log("📦 SESSIONS RAW COUNT =>", allSessionsRaw.length);
      console.log("📦 SESSIONS NORMALIZED COUNT =>", sessions.length);

      // Agrupar por día
      const groupedByDay = sessions.reduce((acc: any, session: any) => {
        const sessionDay = dayjs(session.startDateTime).format("YYYY-MM-DD");
        if (!acc[sessionDay]) acc[sessionDay] = [];
        acc[sessionDay].push(session);
        return acc;
      }, {});

      // Unique rooms & modules
      const uniqueRooms = [
        ...new Set(
          sessions
            .map((s: any) => s.room)
            .filter((r: any) => r !== undefined && r !== null && r !== ""),
        ),
      ];

      const uniqueModules = [
        ...new Set(
          sessions
            .map((s: any) => s?.moduleId?.title)
            .filter((m: any) => m !== undefined && m !== null && m !== ""),
        ),
      ];

      setRooms(uniqueRooms as string[]);
      setModules(uniqueModules as string[]);

      // Ordenar sesiones por hora dentro del día
      for (const day in groupedByDay) {
        groupedByDay[day] = groupedByDay[day].sort((a: any, b: any) =>
          dayjs(a.startDateTime).isBefore(dayjs(b.startDateTime)) ? -1 : 1,
        );
      }

      setAgenda(groupedByDay);

      const dayKeys = Object.keys(groupedByDay).sort((a, b) =>
        dayjs(a).isBefore(dayjs(b)) ? -1 : 1,
      );
      setDays(dayKeys);
      setSelectedDay(dayKeys[0] || "");
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [eventId]);

  // ✅ Mensaje fijo para evento especial (SIN ocultar agenda)
  const SPECIAL_EVENT_ID = "6876c799539413079ae753a7";
  const HEMATOLOGY_URL = "https://www.hematology.org/Highlights-LA";

  const openHematologyLink = async () => {
    try {
      const supported = await Linking.canOpenURL(HEMATOLOGY_URL);
      if (supported) await Linking.openURL(HEMATOLOGY_URL);
      else Alert.alert("Error", "No se pudo abrir el enlace.");
    } catch (e) {
      Alert.alert("Error", "Ocurrió un problema al intentar abrir el enlace.");
    }
  };

  // =========================================================
  // Filters
  // =========================================================
  const applyFilters = (sessions: any[]) => {
    return sessions.filter((session) => {
      const matchesRoom = filterRoom ? session.room === filterRoom : true;
      const matchesModule = filterModule
        ? session.moduleId?.title === filterModule
        : true;
      return matchesRoom && matchesModule;
    });
  };

  const resetFilters = () => {
    setFilterRoom("");
    setFilterModule("");
  };

  // =========================================================
  // Sub-sesiones por BLOQUES (alineadas por tiempo dentro del bloque padre)
  // =========================================================
  const renderSubSessionsInsideBlock = (
    parentSession: any,
    parentBlockHeightPx: number,
  ) => {
    console.log("🔽 Render SUBSESSIONS for:", parentSession?.subSessions);
    const subSessions = Array.isArray(parentSession?.subSessions)
      ? parentSession.subSessions
      : [];
    if (!subSessions.length) return null;

    const parentStart = dayjs(parentSession.startDateTime);
    const parentEnd = dayjs(parentSession.endDateTime);
    const parentMinutes = Math.max(1, parentEnd.diff(parentStart, "minute"));

    // Ajusta esto si tu header ocupa más/menos
    const headerSpace = 78;
    const footerSpace = 8;
    const innerHeight = Math.max(
      40,
      parentBlockHeightPx - headerSpace - footerSpace,
    );

    if (innerHeight < 55) {
      return (
        <Text style={styles.subMore}>{subSessions.length} actividades</Text>
      );
    }

    const pxPerMinInner = innerHeight / parentMinutes;

    const sorted = [...subSessions].sort((a: any, b: any) =>
      dayjs(a.startDateTime).isBefore(dayjs(b.startDateTime)) ? -1 : 1,
    );

    return (
      <View style={[styles.subGridWrap, { height: innerHeight }]}>
        {sorted.map((sub: any, idx: number) => {
          const s = dayjs(sub.startDateTime);
          const e = dayjs(sub.endDateTime);

          const topMin = Math.max(0, s.diff(parentStart, "minute"));
          const durMin = Math.max(1, e.diff(s, "minute"));

          const top = topMin * pxPerMinInner;
          const height = Math.max(28, durMin * pxPerMinInner);

          // ✅ AQUÍ SE RESUELVEN NOMBRES A PARTIR DE IDS
          const names = getSpeakerNames(sub?.speakers || []);

          return (
            <View
              key={sub._id || idx}
              style={[styles.subSessionBlockInnerCalendar, { top, height }]}
            >
              <Text style={styles.subSessionTime} numberOfLines={1}>
                {s.format("HH:mm")} - {e.format("HH:mm")}
              </Text>

              <Text style={styles.subSessionTitle} numberOfLines={2}>
                {sub.title}
              </Text>

              {!!names && (
                <Text style={styles.subSessionSpeakers} numberOfLines={2}>
                  🎤 {names}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // =========================================================
  // Render day calendar
  // =========================================================
  const renderDayCalendar = (sessions: any[]) => {
    const filteredSessions = applyFilters(sessions);
    if (filteredSessions.length === 0) {
      return (
        <View>
          <Text>No hay sesiones disponibles.</Text>
        </View>
      );
    }

    // ✅ Mantengo tu firma actual (si buildCalendarLayout retorna solo items en tu proyecto,
    // vuelve a "const items = buildCalendarLayout(filteredSessions);" y usa tus horas fijas)
    const { items, minHour, maxHour } = buildCalendarLayout(filteredSessions);

    const totalMinutes = (maxHour - minHour + 1) * 60;
    const contentHeight = totalMinutes * PX_PER_MIN;

    return (
      <View
        style={styles.calendarContainer}
        onLayout={(e) => setCalendarWidth(e.nativeEvent.layout.width)}
      >
        {/* Columna de horas */}
        <View style={styles.hoursColumn}>
          {Array.from({ length: maxHour - minHour + 1 }).map((_, idx) => {
            const hour = minHour + idx;
            return (
              <View
                key={hour}
                style={[styles.hourRow, { height: 60 * PX_PER_MIN }]}
              >
                <Text style={styles.hourText}>{`${hour}:00`}</Text>
              </View>
            );
          })}
        </View>

        {/* Área calendario */}
        <View style={styles.calendarGridWrapper}>
          <View style={[styles.calendarGrid, { height: contentHeight }]}>
            {Array.from({ length: maxHour - minHour + 1 }).map((_, idx) => (
              <View
                key={idx}
                style={[styles.hourLine, { top: idx * 60 * PX_PER_MIN }]}
              />
            ))}

            {items.map((it: any, index: number) => {
              const usableWidth = Math.max(0, calendarWidth - 70);
              const gap = 6;
              const colWidth =
                it.cols > 0
                  ? (usableWidth - gap * (it.cols - 1)) / it.cols
                  : usableWidth;

              const left = it.col * (colWidth + gap);
              const speakerNames = getSpeakerNames(it.session?.speakers || []);

              return (
                <TouchableOpacity
                  key={`${it.session._id || index}`}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedSession(it.session);
                    setShowSessionModal(true);
                  }}
                  style={[
                    styles.sessionBlock,
                    { top: it.top, height: it.height, left, width: colWidth },
                  ]}
                >
                  <Text style={styles.sessionBlockTimeLeft}>
                    {dayjs(it.session.startDateTime).format("HH:mm")} -{" "}
                    {dayjs(it.session.endDateTime).format("HH:mm")}
                  </Text>

                  <Text style={styles.sessionBlockTitleFull} numberOfLines={3}>
                    {it.session.title}
                  </Text>

                  {!!speakerNames && (
                    <Text style={styles.sessionBlockSpeakers} numberOfLines={2}>
                      🎤 {speakerNames}
                    </Text>
                  )}

                  {(it.session.room || it.session.moduleId?.title) && (
                    <Text numberOfLines={1} style={styles.sessionBlockMeta}>
                      {it.session.room ? `Salón: ${it.session.room}` : ""}
                      {it.session.room && it.session.moduleId?.title
                        ? " • "
                        : ""}
                      {it.session.moduleId?.title
                        ? `Módulo: ${it.session.moduleId.title}`
                        : ""}
                    </Text>
                  )}

                  {/* ✅ SUBSESIONES EN BLOQUES */}
                  {renderSubSessionsInsideBlock(it.session, it.height)}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ✅ Modal detalle (con altura limitada + scroll interno) */}
        <Modal visible={showSessionModal} animationType="slide" transparent>
          <View style={styles.sessionModalOverlay}>
            <View style={styles.sessionModalCard}>
              <ScrollView
                style={styles.sessionModalScroll}
                contentContainerStyle={styles.sessionModalScrollContent}
                showsVerticalScrollIndicator
              >
                <Text style={styles.sessionModalTitle}>
                  {selectedSession?.title}
                </Text>

                <Text style={styles.sessionModalLine}>
                  🕒{" "}
                  {selectedSession
                    ? `${dayjs(selectedSession.startDateTime).format(
                        "HH:mm",
                      )} - ${dayjs(selectedSession.endDateTime).format("HH:mm")}`
                    : ""}
                </Text>

                {!!selectedSession?.room && (
                  <Text style={styles.sessionModalLine}>
                    📍 Salón: {selectedSession.room}
                  </Text>
                )}

                {!!selectedSession?.moduleId?.title && (
                  <Text style={styles.sessionModalLine}>
                    🧩 Módulo: {selectedSession.moduleId.title}
                  </Text>
                )}

                {(() => {
                  const names = getSpeakerNames(
                    selectedSession?.speakers || [],
                  );
                  if (!names) return null;
                  return (
                    <Text style={styles.sessionModalLine}>
                      🎤 Speakers: {names}
                    </Text>
                  );
                })()}

                {!!selectedSession?.subSessions?.length && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subModalTitle}>Actividades</Text>

                    {selectedSession.subSessions
                      .slice()
                      .sort((a: any, b: any) =>
                        dayjs(a.startDateTime).isBefore(dayjs(b.startDateTime))
                          ? -1
                          : 1,
                      )
                      .map((sub: any, i: number) => {
                        const s = dayjs(sub.startDateTime);
                        const e = dayjs(sub.endDateTime);
                        const subNames = getSpeakerNames(sub?.speakers || []);
                        return (
                          <View key={sub._id || i} style={styles.subModalItem}>
                            <Text
                              style={styles.subModalItemTitle}
                              numberOfLines={2}
                            >
                              {sub.title}
                            </Text>
                            <Text style={styles.subModalItemTime}>
                              {s.format("HH:mm")} - {e.format("HH:mm")}
                            </Text>
                            {!!subNames && (
                              <Text
                                style={styles.subModalItemSpeakers}
                                numberOfLines={2}
                              >
                                🎤 {subNames}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                  </View>
                )}
              </ScrollView>

              <View style={styles.sessionModalFooter}>
                <Button
                  title="Cerrar"
                  onPress={() => setShowSessionModal(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAgenda = () => {
    if (agenda[selectedDay]) return renderDayCalendar(agenda[selectedDay]);
    return <Text>No hay sesiones disponibles para este día.</Text>;
  };

  const renderDayTabs = () => {
    dayjs.locale("es");
    return days.map((day, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayTab,
          selectedDay === day ? styles.selectedDayTab : null,
          { width: `${100 / Math.max(days.length, 1)}%` },
        ]}
        onPress={() => setSelectedDay(day)}
      >
        <Text style={styles.tabText}>
          {dayjs(day).locale("es").format("D/MMM").toLowerCase()}
        </Text>
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando agenda...</Text>
      </View>
    );
  }

  if (days.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay agenda disponible.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {Platform.OS === "ios" && (
          <>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowRoomPicker(true)}
            >
              <Text>{filterRoom || "Salones"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowModulePicker(true)}
            >
              <Text>{filterModule || "Módulos"}</Text>
            </TouchableOpacity>
          </>
        )}

        {Platform.OS === "android" && (
          <View style={styles.androidPickerWrapper}>
            <Picker
              selectedValue={filterRoom}
              onValueChange={(value) => setFilterRoom(value)}
              style={styles.pickerAndroid}
            >
              <Picker.Item label="Salones" value="" />
              {rooms.map((room, index) => (
                <Picker.Item key={index} label={room} value={room} />
              ))}
            </Picker>

            <Picker
              selectedValue={filterModule}
              onValueChange={(value) => setFilterModule(value)}
              style={styles.pickerAndroid}
            >
              <Picker.Item label="Módulos" value="" />
              {modules.map((module, index) => (
                <Picker.Item key={index} label={module} value={module} />
              ))}
            </Picker>
          </View>
        )}

        <IconButton icon="filter-off" size={20} onPress={resetFilters} />
      </View>

      {/* Modales iOS */}
      {Platform.OS === "ios" && (
        <>
          <Modal visible={showRoomPicker} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filterRoom}
                  onValueChange={(value) => {
                    setFilterRoom(value);
                    setShowRoomPicker(false);
                  }}
                >
                  <Picker.Item label="Salones" value="" />
                  {rooms.map((room, index) => (
                    <Picker.Item key={index} label={room} value={room} />
                  ))}
                </Picker>
                <Button
                  title="Cerrar"
                  onPress={() => setShowRoomPicker(false)}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showModulePicker} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filterModule}
                  onValueChange={(value) => {
                    setFilterModule(value);
                    setShowModulePicker(false);
                  }}
                >
                  <Picker.Item label="Módulos" value="" />
                  {modules.map((module, index) => (
                    <Picker.Item key={index} label={module} value={module} />
                  ))}
                </Picker>
                <Button
                  title="Cerrar"
                  onPress={() => setShowModulePicker(false)}
                />
              </View>
            </View>
          </Modal>
        </>
      )}

      {/* Chips */}
      {(filterRoom || filterModule) !== "" && (
        <View style={styles.containerChips}>
          {filterRoom !== "" && (
            <Chip
              closeIcon="close"
              compact
              onClose={() => setFilterRoom("")}
              style={styles.chip}
            >
              <Text style={styles.textChip}>Salón: {filterRoom}</Text>
            </Chip>
          )}
          {filterModule !== "" && (
            <Chip
              closeIcon="close"
              compact
              onClose={() => setFilterModule("")}
              style={styles.chip}
            >
              <Text style={styles.textChip}>Módulo: {filterModule}</Text>
            </Chip>
          )}
        </View>
      )}

      {/* Tabs días */}
      <View style={styles.dayTabContainer}>{renderDayTabs()}</View>

      {/* Agenda */}
      <ScrollView style={styles.scrollContainer}>{renderAgenda()}</ScrollView>

      {/* ✅ Aviso fijo abajo para evento especial (sin ocultar agenda) */}
      {String(eventId) === SPECIAL_EVENT_ID && showSpecialNotice && (
        <View style={styles.specialNotice}>
          <IconButton
            icon="close"
            size={18}
            onPress={() => setShowSpecialNotice(false)}
            style={styles.specialNoticeClose}
          />

          <Text style={styles.specialNoticeText}>
            La programación está sujeta a cambios.
          </Text>

          <Text style={styles.specialNoticeText}>
            Por favor, consulte la versión más actualizada{" "}
            <Text style={styles.specialNoticeLink} onPress={openHematologyLink}>
              aqui
            </Text>
            .
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f5f5f5" },
  specialNotice: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#00BCD4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    position: "relative", // ✅ para que la X se ubique bien
  },

  specialNoticeClose: {
    position: "absolute",
    top: 2,
    right: 2,
    zIndex: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ Notice superior para evento especial

  specialNoticeText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    textAlign: "center",
    fontWeight: "700",
  },
  specialNoticeLink: {
    color: "blue",
    textDecorationLine: "underline",
    fontWeight: "700",
  },

  // ✅ Sub-sesiones por BLOQUES dentro del bloque padre
  subGridWrap: {
    position: "relative",
    marginTop: 6,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  subSessionBlockInnerCalendar: {
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(0, 188, 212, 0.35)",
  },

  // ✅ Subsesiones: horas / titulo / speakers
  subSessionTime: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    color: "#006973",
  },
  subSessionTitle: {
    marginTop: 2,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: "#003f45",
  },
  subSessionSpeakers: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#1f1f1f",
  },

  dayTabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },

  containerChips: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: 8,
  },
  chip: { margin: 2 },
  textChip: { fontSize: 14, lineHeight: 18 },

  dayTab: {
    padding: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 5,
    borderColor: "#C4C4C4",
    backgroundColor: "#fff",
  },
  selectedDayTab: { backgroundColor: "#00BCD4", borderColor: "#00BCD4" },
  tabText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    color: "#333",
  },

  filtersContainer: { flexDirection: "row", justifyContent: "space-between" },
  scrollContainer: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  pickerButton: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  androidPickerWrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  pickerAndroid: { height: 50, width: "50%" },

  calendarContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  hoursColumn: {
    width: 70,
    backgroundColor: "#fafafa",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  hourRow: { justifyContent: "flex-start", paddingTop: 6, paddingLeft: 8 },
  hourText: { fontSize: 14, lineHeight: 18, color: "#666" },

  calendarGridWrapper: { flex: 1 },
  calendarGrid: { position: "relative", backgroundColor: "#fff" },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  sessionBlock: {
    position: "absolute",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "rgba(0, 188, 212, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(0, 188, 212, 0.35)",
    overflow: "hidden",
  },

  // ✅ Sesión principal: hora / titulo / speakers
  sessionBlockTimeLeft: {
    fontSize: 14,
    lineHeight: 18,
    color: "#006973",
    fontWeight: "800",
    textAlign: "left",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  sessionBlockTitleFull: {
    width: "100%",
    alignSelf: "stretch",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: "#003f45",
  },
  sessionBlockSpeakers: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#1f1f1f",
  },

  sessionBlockMeta: {
    fontSize: 14,
    lineHeight: 18,
    color: "#4f4f4f",
    marginTop: 4,
  },

  subMore: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    color: "#006973",
  },

  sessionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  // ✅ Mantiene tu diseño y SOLO limita altura para permitir scroll
  sessionModalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  sessionModalScroll: { flexGrow: 0 },
  sessionModalScrollContent: { paddingBottom: 10 },
  sessionModalFooter: { paddingTop: 10 },

  // ✅ Modal: título / líneas / secciones
  sessionModalTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    marginBottom: 8,
    color: "#111",
  },
  sessionModalLine: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 6,
    color: "#333",
  },

  subModalTitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "#333",
  },
  subModalItem: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
  },
  subModalItemTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: "#003f45",
  },
  subModalItemTime: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#006973",
  },
  subModalItemSpeakers: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#1f1f1f",
  },
});
