import api from "./api";

// Interfaz para News
export interface News {
  _id: string;
  title: string;
  content: string;
  organizationId: string;
  featuredImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Obtener todas las noticias
export const fetchNews = async (): Promise<News[]> => {
  try {
    const response = await api.get("/news");
    return response.data as News[];
  } catch (error) {
    console.error("Error al obtener las noticias:", error);
    throw error;
  }
};

// Obtener una noticia por ID
export const fetchNewsById = async (id: string): Promise<News> => {
  try {
    const response = await api.get(`/news/${id}`);
    return response.data as News;
  } catch (error) {
    console.error(`Error al obtener la noticia con ID ${id}:`, error);
    throw error;
  }
};

// Crear una nueva noticia
export const createNews = async (
  newsData: Omit<News, "_id" | "createdAt" | "updatedAt">
): Promise<News> => {
  try {
    const response = await api.post("/news", newsData);
    return response.data as News;
  } catch (error) {
    console.error("Error al crear la noticia:", error);
    throw error;
  }
};

// Actualizar una noticia por ID
export const updateNews = async (
  id: string,
  newsData: Partial<News>
): Promise<News> => {
  try {
    const response = await api.put(`/news/${id}`, newsData);
    return response.data as News;
  } catch (error) {
    console.error(`Error al actualizar la noticia con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar una noticia por ID
export const deleteNews = async (id: string): Promise<void> => {
  try {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la noticia con ID ${id}:`, error);
    throw error;
  }
};

// Buscar noticias con filtros
export const searchNews = async (filters: any): Promise<News[]> => {
  try {
    const response = await api.get("/news/search", { params: filters });
    return response.data as News[]; 
  } catch (error) {
    console.error("Error al buscar noticias con filtros:", error);
    throw error;
  }
};
