import React, { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import SpeakersList from "./SpeakersList";
import SessionPreview from "./SessionPreview";
import ExpandedSessionContent from "./ExpandedSessionContent";
import {
  AgendaLayout,
  AgendaSession,
  SpeakerIndex,
  expandedTitleSize,
  formatTimeRange,
  getSessionTags,
  isLikelyTruncated,
  resolveSpeakerNames,
  sortChronologically,
  useAgendaMotion,
} from "./utils";
import { agendaColors } from "./theme";

const CARD_PADDING = 16;
const BAR_SPACE = 16; // barra de acento + separación
const COLLAPSED_TITLE_LINES = 2;

type Props = {
  session: AgendaSession;
  sessionKey: string;
  expanded: boolean;
  onToggle: (key: string) => void;
  speakerIndex: SpeakerIndex;
  layout: AgendaLayout;
};

function SessionCard({
  session,
  sessionKey,
  expanded,
  onToggle,
  speakerIndex,
  layout,
}: Props) {
  const motion = useAgendaMotion();

  const speakerNames = useMemo(
    () => resolveSpeakerNames(session.speakers, speakerIndex),
    [session.speakers, speakerIndex],
  );
  const subSessions = useMemo(
    () => sortChronologically(session.subSessions),
    [session.subSessions],
  );
  const tags = useMemo(() => getSessionTags(session), [session]);

  const hasSubs = subSessions.length > 0;
  const time = formatTimeRange(session.startDateTime, session.endDateTime);
  const sideBySide = layout.sideBySide && hasSubs && !expanded;

  // Tipografía según dispositivo
  const collapsedSize = layout.compact ? 16 : layout.tablet ? 19 : 17;
  const innerWidth = layout.cardWidth - CARD_PADDING * 2;
  const collapsedTitleWidth =
    (layout.sideBySide && hasSubs ? innerWidth * 0.52 : innerWidth) -
    BAR_SPACE;
  const expandedTitle = expandedTitleSize(
    session.title,
    innerWidth,
    layout.compact ? 20 : layout.tablet ? 24 : 22,
    16,
  );

  // Sin subsesiones solo se expande si hay algo más que mostrar
  const expandable =
    hasSubs ||
    speakerNames.length > 2 ||
    isLikelyTruncated(
      session.title,
      collapsedTitleWidth,
      collapsedSize,
      COLLAPSED_TITLE_LINES,
    );

  const toggle = useCallback(() => onToggle(sessionKey), [onToggle, sessionKey]);

  const showHeaderToggle = expandable && (expanded || !hasSubs);

  const a11yLabel = [
    session.title,
    time,
    tags.join(", "),
    speakerNames.length ? `Speakers: ${speakerNames.join(", ")}` : "",
    hasSubs ? `${subSessions.length} subsesiones` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Animated.View
      layout={motion.layout}
      style={[styles.card, expanded && styles.cardExpanded]}
    >
      <Pressable
        onPress={toggle}
        disabled={!expandable}
        accessibilityRole={expandable ? "button" : undefined}
        accessibilityLabel={a11yLabel}
        accessibilityHint={
          expandable
            ? expanded
              ? "Contrae la sesión"
              : "Muestra el detalle de la sesión"
            : undefined
        }
        accessibilityState={expandable ? { expanded } : undefined}
        aria-expanded={expandable ? expanded : undefined}
        style={styles.header}
      >
        {!expanded && (
          <Animated.View
            entering={motion.entering}
            exiting={motion.exiting}
            style={styles.bar}
          />
        )}

        <Animated.View
          layout={motion.layout}
          style={[styles.body, sideBySide && styles.bodyRow]}
        >
          <Animated.View
            layout={motion.layout}
            style={[styles.main, sideBySide && styles.mainSide]}
          >
            {(tags.length > 0 || showHeaderToggle) && (
              <View style={styles.topRow}>
                <View style={styles.tags}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text numberOfLines={1} style={styles.tagText}>
                        {tag.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                {showHeaderToggle && (
                  <Pressable
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      toggle();
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={expanded ? "Contraer" : "Ver detalle"}
                    style={({ pressed }) => [
                      expanded ? styles.collapseBtn : styles.chevronBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={agendaColors.navy}
                    />
                    {expanded && !layout.compact && (
                      <Text style={styles.collapseText}>Contraer</Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}

            <Text
              numberOfLines={expanded ? undefined : COLLAPSED_TITLE_LINES}
              style={[
                styles.title,
                expanded
                  ? expandedTitle
                  : {
                      fontSize: collapsedSize,
                      lineHeight: Math.round(collapsedSize * 1.28),
                    },
              ]}
            >
              {session.title}
            </Text>

            <View style={styles.timeRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={agendaColors.muted}
              />
              <Text style={[styles.time, expanded && styles.timeExpanded]}>
                {time}
              </Text>
            </View>

            <SpeakersList names={speakerNames} />
          </Animated.View>

          {!expanded && hasSubs && (
            <Animated.View
              entering={motion.entering}
              exiting={motion.exiting}
              style={sideBySide ? styles.previewSide : styles.previewBelow}
            >
              {sideBySide && <View style={styles.divider} />}
              <View style={styles.previewInner}>
                <SessionPreview subSessions={subSessions} onExpand={toggle} />
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>

      {expanded && hasSubs && (
        <Animated.View entering={motion.entering} exiting={motion.exiting}>
          <ExpandedSessionContent
            subSessions={subSessions}
            speakerIndex={speakerIndex}
            rowLayout={layout.subRow}
            maxHeight={layout.subListMaxHeight}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default memo(SessionCard);

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: CARD_PADDING,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: agendaColors.border,
    backgroundColor: agendaColors.card,
    // Recorta el contenido mientras la tarjeta cambia de tamaño
    overflow: "hidden",
  },
  cardExpanded: { borderWidth: 1.5, borderColor: agendaColors.borderStrong },
  header: { flexDirection: "row" },
  bar: {
    width: 5,
    height: 46,
    marginTop: 2,
    marginRight: BAR_SPACE - 5,
    borderRadius: 3,
    backgroundColor: agendaColors.accent,
  },
  body: { flex: 1, minWidth: 0 },
  bodyRow: { flexDirection: "row", alignItems: "stretch" },
  main: { minWidth: 0, gap: 8 },
  mainSide: { flex: 1.08 },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tags: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: agendaColors.chip,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: agendaColors.navy,
  },
  chevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: agendaColors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  collapseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: agendaColors.border,
    justifyContent: "center",
  },
  collapseText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    color: agendaColors.navy,
  },
  pressed: { opacity: 0.7 },
  title: { fontWeight: "800", color: agendaColors.text },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  time: { fontSize: 15, lineHeight: 20, color: agendaColors.text },
  timeExpanded: { fontWeight: "800" },
  previewSide: { flex: 1, flexDirection: "row", marginLeft: 12 },
  previewBelow: { marginTop: 12 },
  divider: {
    width: 1,
    marginRight: 12,
    backgroundColor: agendaColors.border,
  },
  previewInner: { flex: 1, minWidth: 0 },
});
