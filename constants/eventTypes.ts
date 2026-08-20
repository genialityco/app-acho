export type EventType = "WEBINAR" | "SEMINARIO" | "CONGRESO" | "SIMPOSIO" | "CURSO" | "OTRO";

// Mismos tipos que ofrece el CMS al crear/editar un evento
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WEBINAR: "WEBINAR",
  SEMINARIO: "SEMINARIO",
  CONGRESO: "CONGRESO",
  SIMPOSIO: "SIMPOSIO",
  CURSO: "CURSO",
  OTRO: "OTROS",
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];

// Etiqueta legible para un tipo de evento; si no está en la lista se muestra tal cual
export const getEventTypeLabel = (type?: string | null): string =>
  (type && EVENT_TYPE_LABELS[type as EventType]) || type || "Sin tipo";
