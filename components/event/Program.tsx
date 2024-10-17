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
import { Picker } from "@react-native-picker/picker";
import { ActivityIndicator, Chip, IconButton } from "react-native-paper";

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

  // Función para obtener la agenda completa filtrada por evento
  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const filters = { eventId };
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

      // Extraer salones y módulos únicos para los filtros, excluyendo undefined
      const uniqueRooms = [
        ...new Set(
          sessions
            .map((session: any) => session.room)
            .filter((room: any) => room !== undefined)
        ),
      ];
      const uniqueModules = [
        ...new Set(
          sessions
            .map((session: any) => session.moduleId?.title)
            .filter((module: any) => module !== undefined)
        ),
      ];

      setRooms(uniqueRooms as string[]);
      setModules(uniqueModules as string[]);

      // Ordenar sesiones dentro de cada día cronológicamente
      for (const day in groupedByDay) {
        groupedByDay[day] = groupedByDay[day].sort((a: any, b: any) =>
          dayjs(a.startDateTime).isBefore(dayjs(b.startDateTime)) ? -1 : 1
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
  const renderSessionsTable = (sessions: any[]) => {
    const filteredSessions = applyFilters(sessions);

    if (filteredSessions.length === 0) {
      return (
        <View>
          <Text>No hay sesiones disponibles.</Text>
        </View>
      );
    }

    return (
      <View>
        {filteredSessions.map((session, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.sessionInfoContainer}>
              <Text style={styles.sessionTime}>
                {`${dayjs(session.startDateTime).format("HH:mm")} - ${dayjs(
                  session.endDateTime
                ).format("HH:mm")}`}
              </Text>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              {(session.room || session.moduleId?.title) && (
                <Text
                  variant="labelSmall"
                  style={{ marginTop: 5, color: "gray" }}
                >
                  {session.room && (
                    <>
                      <Text style={{ fontWeight: "bold" }}>Salón: </Text>
                      {session.room}
                    </>
                  )}
                  {session.room && session.moduleId?.title && ", "}
                  {session.moduleId?.title && (
                    <>
                      <Text style={{ fontWeight: "bold" }}>Módulo: </Text>
                      {session.moduleId.title}
                    </>
                  )}
                </Text>
              )}
              {session.speakers.length > 0 && (
                <Text variant="labelSmall" style={{ marginTop: 5 }}>
                  {session.speakers.map(
                    (
                      speaker: { _id: string; names: string },
                      index: number
                    ) => (
                      <TouchableOpacity
                        key={speaker._id}
                        onPress={() =>
                          router.push(
                            `/${tab}/components/speakerdetail?speakerId=${speaker._id}&eventId=${eventId}`
                          )
                        }
                      >
                        <Text style={styles.linkText}>
                          {speaker.names}
                          {index < session.speakers.length - 1 ? ", " : ""}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </Text>
              )}
            </View>
            <View style={styles.speakersContainer}>
              {session.speakers.map(
                (
                  speaker: { imageUrl: any },
                  idx: React.Key | null | undefined
                ) => (
                  <Image
                    key={idx}
                    source={{ uri: speaker.imageUrl }}
                    style={styles.speakerImage}
                  />
                )
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Función para renderizar la agenda por día
  const renderAgenda = () => {
    if (agenda[selectedDay]) {
      return renderSessionsTable(agenda[selectedDay]);
    } else {
      return <Text>No hay sesiones disponibles para este día.</Text>;
    }
  };

  // Renderizar los tabs como "Día 1", "Día 2", etc.
  const renderDayTabs = () => {
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
        <Text style={styles.tabText}>{`Día ${index + 1}`}</Text>
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
        {/* Picker de Salones */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowRoomPicker(true)}
        >
          <Text>{filterRoom || "Salones"}</Text>
        </TouchableOpacity>

        {/* Picker de Módulos */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowModulePicker(true)}
        >
          <Text>{filterModule || "Módulos"}</Text>
        </TouchableOpacity>

        <IconButton icon="filter-off" size={20} onPress={resetFilters} />
      </View>

      {/* Modal para iOS - Salones */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showRoomPicker}
          animationType="slide"
          transparent={true}
        >
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
              <Button title="Cerrar" onPress={() => setShowRoomPicker(false)} />
            </View>
          </View>
        </Modal>
      )}

      {/* Modal para iOS - Módulos */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showModulePicker}
          animationType="slide"
          transparent={true}
        >
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
      )}

      {/* Pickers para Android - Se muestran en línea */}
      {Platform.OS === "android" && (
        <View style={styles.androidPickerContainer}>
          <Picker
            selectedValue={filterRoom}
            onValueChange={(value) => setFilterRoom(value)}
            style={styles.picker}
          >
            <Picker.Item label="Salones" value="" />
            {rooms.map((room, index) => (
              <Picker.Item key={index} label={room} value={room} />
            ))}
          </Picker>

          <Picker
            selectedValue={filterModule}
            onValueChange={(value) => setFilterModule(value)}
            style={styles.picker}
          >
            <Picker.Item label="Módulos" value="" />
            {modules.map((module, index) => (
              <Picker.Item key={index} label={module} value={module} />
            ))}
          </Picker>
        </View>
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
  sessionRoom: {
    fontSize: 14,
    color: "#555",
  },
  sessionModule: {
    fontSize: 14,
    color: "#555",
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
  androidPickerContainer: {
    flexDirection: "column",
    marginVertical: 10,
  },
});
