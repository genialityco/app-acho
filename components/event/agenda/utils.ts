import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated";
import dayjs from "dayjs";
import "dayjs/locale/es";

// =========================================================
// Tipos de la agenda (tal como llegan de /agendas/search)
// =========================================================
export type SpeakerRef =
  | string
  | {
      _id?: any;
      $oid?: string;
      names?: string;
      name?: string;
      speakerId?: any;
    }
  | null
  | undefined;

export interface AgendaSubSession {
  _id?: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  speakers?: SpeakerRef[];
  room?: string;
  order?: number;
}

export interface AgendaSession extends AgendaSubSession {
  typeSession?: string;
  moduleId?: { title?: string } | string | null;
  subSessions: AgendaSubSession[];
}

export type SpeakerIndex = Record<string, string>;

// =========================================================
// Speakers: resolver nombres (objeto poblado o id)
// =========================================================
export const getId = (x: any): string => {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x.$oid === "string") return x.$oid;
  if (typeof x._id === "string") return x._id;
  if (typeof x._id?.$oid === "string") return x._id.$oid;
  if (typeof x.speakerId === "string") return x.speakerId;
  if (typeof x.speakerId?.$oid === "string") return x.speakerId.$oid;
  return "";
};

export const buildSpeakerIndex = (list: any[] = []): SpeakerIndex => {
  const idx: SpeakerIndex = {};
  (list || []).forEach((sp: any) => {
    const id = getId(sp);
    const name = String(sp?.names || sp?.name || "").trim();
    if (id && name) idx[id] = name;
  });
  return idx;
};

export const resolveSpeakerNames = (
  speakers: SpeakerRef[] = [],
  index: SpeakerIndex,
): string[] => {
  const names = (speakers || []).map((s: any) => {
    if (!s) return "";
    if (typeof s === "string") return index[s] || "";
    if (s.names) return String(s.names);
    if (s.name) return String(s.name);
    if (s.speakerId?.names) return String(s.speakerId.names);
    const id = getId(s);
    return id ? index[id] || "" : "";
  });
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))];
};

// =========================================================
// Orden cronológico:
// 1) inicio asc, 2) fin asc, 3) campo `order`, 4) orden original
// =========================================================
export const sortChronologically = <T extends AgendaSubSession>(
  items: T[] = [],
): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const startDiff =
        dayjs(a.item.startDateTime).valueOf() -
        dayjs(b.item.startDateTime).valueOf();
      if (startDiff) return startDiff;

      const endDiff =
        dayjs(a.item.endDateTime).valueOf() -
        dayjs(b.item.endDateTime).valueOf();
      if (endDiff) return endDiff;

      const ao = typeof a.item.order === "number" ? a.item.order : Infinity;
      const bo = typeof b.item.order === "number" ? b.item.order : Infinity;
      if (ao !== bo) return ao < bo ? -1 : 1;

      return a.index - b.index;
    })
    .map(({ item }) => item);

export const getSessionKey = (session: AgendaSubSession, index: number) =>
  session._id || `${session.startDateTime}|${session.endDateTime}|${index}`;

export const formatTimeRange = (start: string, end: string) =>
  `${dayjs(start).format("HH:mm")} – ${dayjs(end).format("HH:mm")}`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatDayPill = (day: string) => {
  const d = dayjs(day).locale("es");
  return {
    label: `${capitalize(d.format("ddd").replace(".", ""))} ${d.format("D")}`,
    month: capitalize(d.format("MMMM")),
  };
};

export const formatDayHeading = (day: string) =>
  capitalize(
    dayjs(day).locale("es").format("dddd D [de] MMMM [de] YYYY"),
  );

// =========================================================
// Tipografía: estimación de líneas y escalado de títulos
// =========================================================
const upperRatio = (text: string) => {
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, "");
  if (!letters.length) return 0;
  return letters.replace(/[^A-ZÁÉÍÓÚÑÜ]/g, "").length / letters.length;
};

// Ancho medio de un glifo; las mayúsculas ocupan bastante más
const avgCharWidth = (text: string, fontSize: number) =>
  fontSize * (upperRatio(text) > 0.6 ? 0.68 : 0.54);

export const isLikelyTruncated = (
  text: string,
  width: number,
  fontSize: number,
  lines: number,
) => {
  if (width <= 0) return text.length > 60;
  const perLine = Math.max(1, Math.floor(width / avgCharWidth(text, fontSize)));
  return text.length > perLine * lines * 0.9;
};

// En el estado expandido el título se muestra completo; si es muy largo se
// reduce el tamaño para que no ocupe media pantalla.
export const expandedTitleSize = (
  text: string,
  width: number,
  baseSize: number,
  minSize: number,
) => {
  let size = baseSize;
  while (size > minSize) {
    const perLine = Math.max(1, Math.floor(width / avgCharWidth(text, size)));
    if (Math.ceil(text.length / perLine) <= 4) break;
    size -= 1;
  }
  return { fontSize: size, lineHeight: Math.round(size * 1.28) };
};

// =========================================================
// Layout responsive
// =========================================================
export const AGENDA_MAX_WIDTH = 860;
const CONTAINER_PADDING = 12;

export const useAgendaLayout = () => {
  const { width, height, fontScale } = useWindowDimensions();
  return useMemo(() => {
    const cardWidth = Math.min(width - CONTAINER_PADDING * 2, AGENDA_MAX_WIDTH);
    const effective = cardWidth / Math.max(fontScale, 1);
    return {
      cardWidth,
      compact: effective < 360,
      tablet: width >= 768,
      // En teléfonos estrechos la previsualización va debajo para que ambos
      // títulos se lean completos; en pantallas amplias se mantienen dos columnas.
      sideBySide: effective >= 430,
      // Subsesión expandida: título a la izquierda, horario a la derecha
      subRow: effective >= 540,
      subListMaxHeight: Math.round(Math.max(260, Math.min(height * 0.55, 560))),
    };
  }, [width, height, fontScale]);
};

export type AgendaLayout = ReturnType<typeof useAgendaLayout>;

// =========================================================
// Animaciones (respetan prefers-reduced-motion)
// =========================================================
export const useAgendaMotion = () => {
  const reduceMotion = useReducedMotion();
  return useMemo(
    () =>
      reduceMotion
        ? { layout: undefined, entering: undefined, exiting: undefined }
        : {
            layout: LinearTransition.duration(320).easing(
              Easing.out(Easing.cubic),
            ),
            entering: FadeIn.duration(240).delay(120),
            exiting: FadeOut.duration(140),
          },
    [reduceMotion],
  );
};
