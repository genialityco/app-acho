import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { AgendaSubSession } from "./utils";
import { agendaColors } from "./theme";

const PREVIEW_LIMIT = 3;

type Props = {
  subSessions: AgendaSubSession[];
  onExpand: () => void;
};

// Previsualización lateral (estado contraído): solo títulos, máximo 3
export default function SessionPreview({ subSessions, onExpand }: Props) {
  const rest = subSessions.length - PREVIEW_LIMIT;

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          Subsesiones
        </Text>
        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            onExpand();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Ver las ${subSessions.length} subsesiones`}
          style={({ pressed }) => [styles.plus, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {subSessions.slice(0, PREVIEW_LIMIT).map((sub, i) => (
        <View key={sub._id || i} style={styles.item}>
          <Text numberOfLines={1} style={styles.itemText}>
            {sub.title}
          </Text>
        </View>
      ))}

      {rest > 0 && (
        <Text style={styles.rest}>
          +{rest} {rest === 1 ? "actividad más" : "actividades más"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 6,
    padding: 10,
    borderRadius: 16,
    backgroundColor: agendaColors.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  heading: {
    flexShrink: 0,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: agendaColors.navy,
  },
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: agendaColors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.75 },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: agendaColors.border,
    backgroundColor: agendaColors.card,
  },
  itemText: { fontSize: 13, lineHeight: 18, color: agendaColors.text },
  rest: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: agendaColors.accent,
    textAlign: "right",
  },
});
