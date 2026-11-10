import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import SubsessionCard from "./SubsessionCard";
import { AgendaSubSession, SpeakerIndex } from "./utils";
import { agendaColors } from "./theme";

type Props = {
  subSessions: AgendaSubSession[];
  speakerIndex: SpeakerIndex;
  rowLayout: boolean;
  maxHeight: number;
};

// Contenedor inferior del estado expandido con todas las subsesiones
export default function ExpandedSessionContent({
  subSessions,
  speakerIndex,
  rowLayout,
  maxHeight,
}: Props) {
  const count = subSessions.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="layers-outline" size={22} color={agendaColors.navy} />
        <Text style={styles.heading} numberOfLines={1}>
          Subsesiones
        </Text>
        <View style={styles.count}>
          <Text style={styles.countText}>
            {count} {count === 1 ? "actividad" : "actividades"}
          </Text>
        </View>
      </View>

      <View style={styles.box}>
        <ScrollView
          style={{ maxHeight }}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {subSessions.map((sub, i) => (
            <SubsessionCard
              key={sub._id || `${sub.startDateTime}-${i}`}
              sub={sub}
              speakerIndex={speakerIndex}
              rowLayout={rowLayout}
              isLast={i === count - 1}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: agendaColors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  heading: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: agendaColors.text,
  },
  count: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: agendaColors.chip,
  },
  countText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: agendaColors.navy,
  },
  box: {
    borderRadius: 16,
    backgroundColor: agendaColors.soft,
    overflow: "hidden",
  },
  scrollContent: { paddingTop: 10, paddingRight: 10, paddingLeft: 4 },
});
