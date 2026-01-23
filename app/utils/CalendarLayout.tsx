import dayjs from "dayjs";

export type CalendarItem = {
  session: any;
  top: number;
  height: number;
  col: number;
  cols: number;
};

export const MIN_HOUR = 7; // hora inicio del calendario
export const MAX_HOUR = 20; // hora fin del calendario
export const PX_PER_MIN = 8; // escala vertical

// ✅ Gap visual entre bloques para evitar “montajes” por redondeo
const VERTICAL_GAP_PX = 8;

// ✅ helper para clamp
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/**
 * Asigna columnas para sesiones que se solapan (interval graph coloring simple).
 * Retorna items con {top,height,col,cols} para dibujar en layout absoluto.
 */
export function buildCalendarLayout(sessions: any[]): CalendarItem[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      dayjs(a.startDateTime).valueOf() - dayjs(b.startDateTime).valueOf(),
  );

  const minDay = MIN_HOUR * 60;
  const maxDay = MAX_HOUR * 60;

  // Convertimos a intervalos
  const intervals = sorted.map((s) => {
    const start = dayjs(s.startDateTime);
    const end = dayjs(s.endDateTime);

    return {
      session: s,
      startMin: start.hour() * 60 + start.minute(),
      endMin: end.hour() * 60 + end.minute(),
    };
  });

  const result: CalendarItem[] = [];

  let i = 0;
  while (i < intervals.length) {
    let cluster = [intervals[i]];
    let clusterEnd = intervals[i].endMin;
    let j = i + 1;

    while (j < intervals.length && intervals[j].startMin < clusterEnd) {
      cluster.push(intervals[j]);
      clusterEnd = Math.max(clusterEnd, intervals[j].endMin);
      j++;
    }

    const activeCols: number[] = [];
    const assigned = cluster.map((it) => {
      let col = -1;

      for (let c = 0; c < activeCols.length; c++) {
        if (activeCols[c] <= it.startMin) {
          col = c;
          break;
        }
      }

      if (col === -1) {
        col = activeCols.length;
        activeCols.push(it.endMin);
      } else {
        activeCols[col] = it.endMin;
      }

      return { ...it, col };
    });

    const cols = activeCols.length;

    // Convertimos a layout (top/height) limitado al rango MIN_HOUR..MAX_HOUR
    for (const it of assigned) {
      // ✅ clamp al rango visible
      const startMin = clamp(it.startMin, minDay, maxDay);
      const endMin = clamp(it.endMin, minDay, maxDay);

      // ✅ si NO intersecta el rango horario, NO lo dibujes (evita bloques fantasma)
      if (it.endMin <= minDay || it.startMin >= maxDay) {
        continue;
      }

      // ✅ si quedó inválido tras clamp, no dibujar
      if (endMin <= startMin) {
        continue;
      }

      // ✅ redondea para evitar solapes por decimales
      const top = Math.round((startMin - minDay) * PX_PER_MIN);

      // ✅ resta gap para que nunca “toquen”
      const rawHeight = (endMin - startMin) * PX_PER_MIN;
      const height = Math.max(18, Math.round(rawHeight - VERTICAL_GAP_PX));

      result.push({
        session: it.session,
        top,
        height,
        col: it.col,
        cols,
      });
    }

    i = j;
  }

  return result;
}
