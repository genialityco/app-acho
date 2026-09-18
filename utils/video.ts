// Helpers para memorias en video (Vimeo o Bunny Stream)

export const isVimeoUrl = (url: string): boolean => /vimeo\.com/i.test(url ?? "");

// Convierte un timestamp de transcripción "HH:MM:SS.mmm" a segundos totales.
export const parseTimestampToSeconds = (timestamp: string): number => {
  const [hours, minutes, seconds] = timestamp.split(":");
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    Math.floor(parseFloat(seconds))
  );
};

// Etiqueta legible para mostrar en los resultados de búsqueda (m:ss o h:mm:ss).
export const formatSecondsLabel = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const paddedMinutes = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const paddedSeconds = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`;
};

// Arma la URL del reproductor (iframe embed) apuntando al segundo indicado,
// soportando tanto Vimeo como Bunny Stream.
export const buildVideoUrlAtTime = (url: string, seconds?: number, autoplay: boolean = true): string => {
  if (!url) return url;

  const hasValidTime = seconds !== undefined && !Number.isNaN(seconds) && seconds >= 0;

  if (isVimeoUrl(url)) {
    const separator = url.includes("?") ? "&" : "?";
    const base = autoplay ? `${url}${separator}autoplay=1` : url;
    return hasValidTime ? `${base}#t=${Math.floor(seconds!)}s` : base;
  }

  // Bunny Stream (iframe.mediadelivery.net u otro dominio configurado)
  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "true");
  if (hasValidTime) params.set("t", String(Math.floor(seconds!)));
  const query = params.toString();
  if (!query) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${query}`;
};
