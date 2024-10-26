import api from "./api";

// Interfaz para Highlights
export interface Highlight {
  _id: string;
  name: string;
  eventId: string;
  description: string;
  imageUrl: string;
  vimeoUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

// Obtener todos los highlights
export const fetchHighlights = async (): Promise<Highlight[]> => {
  try {
    const response = await api.get("/highlights");
    return response.data as Highlight[]; // Typecasting de la respuesta a un array de highlights
  } catch (error) {
    console.error("Error al obtener los highlights:", error);
    throw error;
  }
};

// Obtener un highlight por ID
export const fetchHighlightById = async (id: string): Promise<Highlight> => {
  try {
    const response = await api.get(`/highlights/${id}`);
    return response.data as Highlight; // Typecasting de la respuesta a un highlight
  } catch (error) {
    console.error(`Error al obtener el highlight con ID ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo highlight
export const createHighlight = async (
  highlightData: Omit<Highlight, "_id" | "createdAt" | "updatedAt">
): Promise<Highlight> => {
  try {
    const response = await api.post("/highlights", highlightData);
    return response.data as Highlight; // Typecasting de la respuesta a un highlight
  } catch (error) {
    console.error("Error al crear el highlight:", error);
    throw error;
  }
};

// Actualizar un highlight por ID
export const updateHighlight = async (
  id: string,
  highlightData: Partial<Highlight>
): Promise<Highlight> => {
  try {
    const response = await api.put(`/highlights/${id}`, highlightData);
    return response.data as Highlight; // Typecasting de la respuesta a un highlight
  } catch (error) {
    console.error(`Error al actualizar el highlight con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un highlight por ID
export const deleteHighlight = async (id: string): Promise<void> => {
  try {
    const response = await api.delete(`/highlights/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el highlight con ID ${id}:`, error);
    throw error;
  }
};

// Buscar highlights con filtros
export const searchHighlights = async (filters: any): Promise<Highlight[]> => {
  try {
    const response = await api.get("/highlights/search", { params: filters });
    return response.data as Highlight[];
  } catch (error) {
    console.error("Error al buscar highlights con filtros:", error);
    throw error;
  }
};
