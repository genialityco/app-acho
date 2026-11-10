import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import SpeakersList from "./SpeakersList";
import {
  AgendaSubSession,
  SpeakerIndex,
  formatTimeRange,
  resolveSpeakerNames,
} from "./utils";
import { agendaColors } from "./theme";

const CLAMP_LINES = 3;

type Props = {
  sub: AgendaSubSession;
  speakerIndex: SpeakerIndex;
  rowLayout: boolean;
  isLast: boolean;
};

export default function SubsessionCard({
  sub,
  speakerIndex,
  rowLayout,
  isLast,
}: Props) {
  const [showFull, setShowFull] = useState(false);
  const names = resolveSpeakerNames(sub.speakers, speakerIndex);
  const time = formatTimeRange(sub.startDateTime, sub.endDateTime);
  // Con layout en fila la columna del título es más angosta
  const isLong = sub.title.length > (rowLayout ? 110 : 90);

  const meta = (
    <View style={[styles.meta, rowLayout && styles.metaRow]}>
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={15} color={agendaColors.muted} />
        <Text style={styles.time}>{time}</Text>
      </View>
      <SpeakersList names={names} size="sm" />
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.rail}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>

      <View style={[styles.card, rowLayout && styles.cardRow]}>
        <View style={rowLayout ? styles.titleCol : undefined}>
          <Text
            numberOfLines={showFull || !isLong ? undefined : CLAMP_LINES}
            accessibilityLabel={sub.title}
            style={styles.title}
          >
            {sub.title}
          </Text>
          {isLong && (
            <Pressable
              onPress={() => setShowFull((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ expanded: showFull }}
              aria-expanded={showFull}
              style={styles.toggle}
            >
              <Text style={styles.toggleText}>
                {showFull ? "Ver menos" : "Ver título completo"}
              </Text>
            </Pressable>
          )}
        </View>
        {meta}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "stretch" },
  rail: { width: 18, alignItems: "center" },
  dot: {
    width: 10,
    height: 10,
    marginTop: 18,
    borderRadius: 5,
    backgroundColor: agendaColors.dot,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: agendaColors.border,
  },
  card: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    marginLeft: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: agendaColors.border,
    backgroundColor: agendaColors.card,
  },
  cardRow: { flexDirection: "row", gap: 14 },
  titleCol: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: agendaColors.text,
  },
  toggle: { alignSelf: "flex-start", marginTop: 4, paddingVertical: 2 },
  toggleText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: agendaColors.accent,
  },
  meta: { gap: 4 },
  metaRow: { width: "36%", minWidth: 150 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  time: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: agendaColors.navy,
  },
});
