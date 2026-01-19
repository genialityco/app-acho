import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Button,
} from "react-native";
import { Text } from "react-native-paper";
import { searchAgendas } from "@/services/api/agendaService";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs"; // Para formatear las fechas
import "dayjs/locale/es";
import { Picker } from "@react-native-picker/picker";
import { ActivityIndicator, Chip, IconButton } from "react-native-paper";
import {
  buildCalendarLayout,
  MIN_HOUR,
  MAX_HOUR,
  PX_PER_MIN,
} from "@/app/utils/CalendarLayout";

export default function Program() {
  const { eventId, tab } = useLocalSearchParams();
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

  // Función para obtener la agenda completa filtrada por evento
  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const filters = { eventId: eventId };
      const response = await searchAgendas(filters);

      if (response.message === "No se encontraron agendas") {
        return;
      }

      const sessions = response.data.items[0].sessions;

      // Agrupar sesiones por días
      const groupedByDay = sessions.reduce((acc: any, session: any) => {
        const sessionDay = dayjs(session.startDateTime).format("YYYY-MM-DD");
        if (!acc[sessionDay]) acc[sessionDay] = [];
        acc[sessionDay].push(session);
        return acc;
      }, {});

      // Extraer salones y módulos únicos para los filtros
      const uniqueRooms = [
        ...new Set(
          sessions
            .map((session: any) => session.room)
            .filter(
              (room: any) => room !== undefined && room !== null && room !== "",
            ),
        ),
      ];
      const uniqueModules = [
        ...new Set(
          sessions
            .map((session: any) => session.moduleId?.title)
            .filter(
              (module: any) =>
                module !== undefined && module !== null && module !== "",
            ),
        ),
      ];

      setRooms(uniqueRooms as string[]);
      setModules(uniqueModules as string[]);

      // Ordenar sesiones dentro de cada día cronológicamente
      for (const day in groupedByDay) {
        groupedByDay[day] = groupedByDay[day].sort((a: any, b: any) =>
          dayjs(a.startDateTime).isBefore(dayjs(b.startDateTime)) ? -1 : 1,
        );
      }
      setAgenda(groupedByDay);
      setDays(Object.keys(groupedByDay));
      setSelectedDay(Object.keys(groupedByDay)[0]);
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar la agenda al montar el componente
  useEffect(() => {
    fetchAgenda();
  }, [eventId]);

  // Aplicar los filtros de salón y módulo
  const applyFilters = (sessions: any[]) => {
    return sessions.filter((session) => {
      const matchesRoom = filterRoom ? session.room === filterRoom : true;
      const matchesModule = filterModule
        ? session.moduleId?.title === filterModule
        : true;
      return matchesRoom && matchesModule;
    });
  };

  // Función para restablecer los filtros
  const resetFilters = () => {
    setFilterRoom("");
    setFilterModule("");
  };

  // Renderizar sesiones en una tabla
  const renderDayCalendar = (sessions: any[]) => {
    const filteredSessions = applyFilters(sessions);
    if (filteredSessions.length === 0) {
      return (
        <View>
          <Text>No hay sesiones disponibles.</Text>
        </View>
      );
    }

    const items = buildCalendarLayout(filteredSessions);

    const totalMinutes = (MAX_HOUR - MIN_HOUR) * 60;
    const contentHeight = totalMinutes * PX_PER_MIN;

    return (
      <View
        style={styles.calendarContainer}
        onLayout={(e) => setCalendarWidth(e.nativeEvent.layout.width)}
      >
        {/* Columna de horas */}
        <View style={styles.hoursColumn}>
          {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }).map((_, idx) => {
            const hour = MIN_HOUR + idx;
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

        {/* Área del calendario */}
        <View style={styles.calendarGridWrapper}>
          <View style={[styles.calendarGrid, { height: contentHeight }]}>
            {/* líneas horizontales por hora */}
            {Array.from({ length: MAX_HOUR - MIN_HOUR + 1 }).map((_, idx) => (
              <View
                key={idx}
                style={[styles.hourLine, { top: idx * 60 * PX_PER_MIN }]}
              />
            ))}

            {/* Bloques de sesiones (paralelas en columnas) */}
            {items.map((it, index) => {
              const usableWidth = Math.max(0, calendarWidth - 70); // 70 aprox horasColumn
              const gap = 6;
              const colWidth =
                it.cols > 0
                  ? (usableWidth - gap * (it.cols - 1)) / it.cols
                  : usableWidth;

              const left = it.col * (colWidth + gap);

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
                    it.session?.featured ? styles.sessionBlockFeatured : null,
                    {
                      top: it.top,
                      height: it.height,
                      left,
                      width: colWidth,
                    },
                  ]}
                >
                  <View style={styles.sessionBlockHeader}>
                    <Text numberOfLines={5} style={styles.sessionBlockTitle}>
                      {it.session.title}
                    </Text>

                    <Text style={styles.sessionBlockTime}>
                      {dayjs(it.session.startDateTime).format("HH:mm")} -{" "}
                      {dayjs(it.session.endDateTime).format("HH:mm")}
                    </Text>
                  </View>
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
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Modal detalle */}
        <Modal visible={showSessionModal} animationType="slide" transparent>
          <View style={styles.sessionModalOverlay}>
            <View style={styles.sessionModalCard}>
              <Text style={styles.sessionModalTitle}>
                {selectedSession?.title}
              </Text>

              <Text style={styles.sessionModalLine}>
                🕒{" "}
                {selectedSession
                  ? `${dayjs(selectedSession.startDateTime).format("HH:mm")} - ${dayjs(selectedSession.endDateTime).format("HH:mm")}`
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

              {!!selectedSession?.description && (
                <Text style={styles.sessionModalDesc}>
                  {selectedSession.description}
                </Text>
              )}

              {!!selectedSession?.speakers?.length && (
                <Text style={styles.sessionModalLine}>
                  🎤 Speakers:{" "}
                  {selectedSession.speakers.map((s: any) => s.names).join(", ")}
                </Text>
              )}

              <View style={{ marginTop: 12 }}>
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

  // Renderizar la agenda por día seleccionado
  const renderAgenda = () => {
    if (agenda[selectedDay]) {
      return renderDayCalendar(agenda[selectedDay]);
    }
    return <Text>No hay sesiones disponibles para este día.</Text>;
  };

  // Renderizar los tabs como "Día 1", "Día 2", etc.
  const renderDayTabs = () => {
    dayjs.locale("es");

    return days.map((day, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayTab,
          selectedDay === day ? styles.selectedDayTab : null,
          { width: `${100 / days.length}%` },
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
      {/* Filtros dinámicos de Salón y Módulo */}
      <View style={styles.filtersContainer}>
        {Platform.OS === "ios" && (
          // TouchableOpacity para iOS
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

      {/* Modales para iOS */}
      {Platform.OS === "ios" && (
        <>
          {/* Modal para Salones */}
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

          {/* Modal para Módulos */}
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

      {/* Chips de filtros */}
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

      {/* Selector de Día */}
      <View style={styles.dayTabContainer}>{renderDayTabs()}</View>

      {/* Mostrar agenda según el día seleccionado */}
      <ScrollView style={styles.scrollContainer}>
        {loading ? <Text>Cargando...</Text> : renderAgenda()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f5f5f5",
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
  chip: {
    margin: 2,
  },
  textChip: {
    fontSize: 12,
  },
  linkText: {
    color: "#00796b",
  },
  dayTab: {
    padding: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 5,
    borderColor: "#C4C4C4",
    backgroundColor: "#fff",
  },
  selectedDayTab: {
    backgroundColor: "#00BCD4",
    borderColor: "#00BCD4",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  picker: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  sessionInfoContainer: {
    flex: 3,
    paddingRight: 10,
    zIndex: 1,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
    color: "rgb(0, 105, 115)",
  },
  speakersContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 1,
    flexWrap: "wrap",
    gap: 5,
    zIndex: 0,
  },
  speakerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  pickerAndroid: {
    height: 50,
    width: "50%",
  },

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

  hourRow: {
    justifyContent: "flex-start",
    paddingTop: 6,
    paddingLeft: 8,
  },

  hourText: {
    fontSize: 12,
    color: "#666",
  },

  calendarGridWrapper: {
    flex: 1,
  },

  calendarGrid: {
    position: "relative",
    backgroundColor: "#fff",
  },

  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  sessionBlockHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  sessionBlock: {
    position: "absolute",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "rgba(0, 188, 212, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(0, 188, 212, 0.35)",
  },

  sessionBlockTime: {
    flexShrink: 0, // la hora no se encoge
    fontSize: 11,
    color: "#006973",
    fontWeight: "700",
    textAlign: "right",
  },

  sessionBlockTitle: {
    flex: 1, // título ocupa lo disponible
    fontSize: 13,
    fontWeight: "700",
    color: "#003f45",
  },

  sessionBlockMeta: {
    fontSize: 11,
    color: "#4f4f4f",
    marginTop: 4,
  },

  sessionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  sessionModalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  sessionModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  sessionModalLine: {
    fontSize: 14,
    marginTop: 6,
    color: "#333",
  },

  sessionModalDesc: {
    marginTop: 10,
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  sessionBlockFeatured: {
    backgroundColor: "rgba(255, 193, 7, 0.28)", // amarillo suave
    borderColor: "rgba(255, 193, 7, 0.85)",
    borderWidth: 2,
  },
  featuredLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
    color: "#8a6d00",
  },
});
