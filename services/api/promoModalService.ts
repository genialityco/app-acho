import api from "./api";

export interface PromoConfig {
  isActive: boolean;
  mediaType: "image" | "video";
  imageUri: string;
  videoUri: string;
  ctaUrl: string;
  showButton: boolean;
  imageOnPressUrl: string;
}

export const fetchPromoModalConfig = async (): Promise<{ data: PromoConfig }> => {
  try {
    const response = await api.get("/promo-modal");
    return response.data;
  } catch (error) {
    console.error("Error al obtener configuración del modal promo:", error);
    throw error;
  }
};
