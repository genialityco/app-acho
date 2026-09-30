import { useCallback } from "react";
import { Linking } from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";
import { fetchEventById } from "@/services/api/eventService";
import { searchMembers } from "@/services/api/memberService";

/**
 * Enlaces internos configurables desde el administrador (contenido de las
 * novedades y "redirección" de la tarjeta en el listado).
 *
 * Formatos soportados:
 *  - achoapp://evento/<eventId>     -> detalle del evento (próximo o anterior)
 *  - achoapp://noticia/<newsId>     -> detalle de una novedad
 *  - achoapp://seccion/<nombre>     -> una sección de la app (ver SECTION_ROUTES)
 *  - http(s)://...                  -> se abre fuera de la app
 */
export const APP_LINK_SCHEME = "achoapp://";

const SECTION_ROUTES: Record<string, string> = {
  novedades: "/(tabs)/home",
  proximos: "/(tabs)/(index)",
  anteriores: "/(tabs)/eventosbefore",
  acho: "/(tabs)/achoinfo",
  perfil: "/(tabs)/menu",
  "mis-eventos": "/(tabs)/menu/components/myevents",
  "mis-certificados": "/(tabs)/menu/components/mycertificates",
  soporte: "/(tabs)/menu/components/support",
};

export const isAppLink = (url?: string | null): boolean =>
  typeof url === "string" && url.trim().toLowerCase().startsWith(APP_LINK_SCHEME);

const parseAppLink = (url: string) => {
  const match = url
    .trim()
    .match(/^achoapp:\/\/([^/?#]+)\/?([^?#]*)/i);
  if (!match) return null;
  return {
    target: match[1].toLowerCase(),
    value: decodeURIComponent(match[2] || "").replace(/\/+$/, ""),
  };
};

export function useOpenAppLink() {
  const { userId } = useAuth();
  const { organization } = useOrganization();

  const openEvent = useCallback(
    async (eventId: string) => {
      let isPast = false;
      try {
        const response = await fetchEventById(eventId);
        const event = response?.data ?? response;
        const endDate = event?.endDate || event?.startDate;
        isPast = !!endDate && new Date(endDate) < new Date();
      } catch (error) {
        console.error("Error al obtener el evento del enlace:", error);
      }

      if (isPast) {
        router.push(
          `/(tabs)/eventosbefore/components/eventdetailb?eventId=${eventId}` as any,
        );
        return;
      }

      let isMemberActive = false;
      let memberId = "";
      try {
        const filters: Record<string, any> = { userId };
        if (organization?._id) filters.organizationId = organization._id;
        const response = await searchMembers(filters);
        const member = response?.data?.items?.[0];
        isMemberActive = Boolean(member?.memberActive);
        memberId = member?._id ?? "";
      } catch (error) {
        console.error("Error al verificar membresía:", error);
      }

      router.push(
        `/(tabs)/(index)/components/eventdetail?eventId=${eventId}&isMemberActive=${isMemberActive}&memberId=${memberId}` as any,
      );
    },
    [userId, organization?._id],
  );

  /** Devuelve true si el enlace se pudo manejar. */
  return useCallback(
    async (url?: string | null): Promise<boolean> => {
      if (!url || !url.trim()) return false;

      if (!isAppLink(url)) {
        if (/^https?:\/\//i.test(url.trim())) {
          await Linking.openURL(url.trim());
          return true;
        }
        return false;
      }

      const link = parseAppLink(url);
      if (!link) return false;

      switch (link.target) {
        case "evento":
          if (!link.value) return false;
          await openEvent(link.value);
          return true;
        case "noticia":
          if (!link.value) return false;
          router.push(`/home/components/novelty?newId=${link.value}` as any);
          return true;
        case "seccion": {
          const route = SECTION_ROUTES[link.value.toLowerCase()];
          if (!route) return false;
          router.push(route as any);
          return true;
        }
        default:
          console.warn("Enlace de la app no soportado:", url);
          return false;
      }
    },
    [openEvent],
  );
}
