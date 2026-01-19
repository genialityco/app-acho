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
export const PX_PER_MIN = 3.5; // escala vertical: 2px por minuto

/**
 * Asigna columnas para sesiones que se solapan (interval graph coloring simple).
 * Retorna items con {top,height,col,cols} para dibujar en layout absoluto.
 */
export function buildCalendarLayout(sessions: any[]): CalendarItem[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      dayjs(a.startDateTime).valueOf() - dayjs(b.startDateTime).valueOf()
  );

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
      const startMin = Math.max(it.startMin, MIN_HOUR * 60);
      const endMin = Math.min(it.endMin, MAX_HOUR * 60);

      const top = (startMin - MIN_HOUR * 60) * PX_PER_MIN;
      const height = Math.max(18, (endMin - startMin) * PX_PER_MIN); // min height

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
