import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

import { agendaColors } from "./theme";

type Props = {
  names: string[];
  max?: number;
  size?: "md" | "sm";
};

export default function SpeakersList({ names, max = 2, size = "md" }: Props) {
  const [showAll, setShowAll] = useState(false);
  if (!names.length) return null;

  const hidden = names.length - max;
  const visible = showAll || hidden <= 0 ? names : names.slice(0, max);
  const sm = size === "sm";

  return (
    <View style={styles.list}>
      {visible.map((name) => (
        <View key={name} style={styles.row}>
          <Ionicons
            name="person-outline"
            size={sm ? 14 : 16}
            color={agendaColors.muted}
          />
          <Text
            numberOfLines={1}
            style={[styles.name, sm ? styles.nameSm : styles.nameMd]}
          >
            {name}
          </Text>
        </View>
      ))}

      {hidden > 0 && (
        <Pressable
          // Pressable anidado: captura el toque y no expande/contrae la tarjeta
          onPress={(e) => {
            e?.stopPropagation?.();
            setShowAll((v) => !v);
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityState={{ expanded: showAll }}
          aria-expanded={showAll}
          accessibilityLabel={
            showAll
              ? "Mostrar menos speakers"
              : `Mostrar ${hidden} speakers más`
          }
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
        >
          <Text style={styles.moreText}>
            {showAll ? "Ver menos" : `+${hidden}`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4, alignItems: "flex-start", alignSelf: "stretch" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "stretch",
  },
  name: { flexShrink: 1, color: agendaColors.text },
  nameMd: { fontSize: 14, lineHeight: 19 },
  nameSm: { fontSize: 13, lineHeight: 17, color: agendaColors.muted },
  more: {
    marginTop: 2,
    minHeight: 28,
    minWidth: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: agendaColors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    color: agendaColors.navy,
  },
  pressed: { opacity: 0.7 },
});
