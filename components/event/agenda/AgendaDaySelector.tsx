import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { formatDayPill } from "./utils";
import { agendaColors } from "./theme";

type Props = {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
};

export default function AgendaDaySelector({
  days,
  selectedDay,
  onSelect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="tablist"
    >
      <View style={styles.track}>
        {days.map((day) => {
          const selected = day === selectedDay;
          const { label, month } = formatDayPill(day);
          return (
            <Pressable
              key={day}
              onPress={() => onSelect(day)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label} de ${month}`}
              style={({ pressed }) => [
                styles.pill,
                selected && styles.pillSelected,
                pressed && !selected && styles.pressed,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.label, selected && styles.textSelected]}
              >
                {label}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.month, selected && styles.textSelected]}
              >
                {month}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  track: { flex: 1, flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    minWidth: 92,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: agendaColors.border,
    backgroundColor: agendaColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelected: {
    backgroundColor: agendaColors.navy,
    borderColor: agendaColors.navy,
  },
  pressed: { backgroundColor: agendaColors.soft },
  label: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: agendaColors.text,
  },
  month: { fontSize: 13, lineHeight: 17, color: agendaColors.muted },
  textSelected: { color: "#FFFFFF" },
});
