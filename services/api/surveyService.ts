import api from "./api";

// Interfaz para las preguntas
export interface Question {
  _id: string;
  type: 'radio' | 'text' | 'checkbox';
  title: string;
  options?: string[];
}

// Interfaz para las encuestas
export interface Survey {
  _id: string;
  title: string;
  questions: Question[];
  isPublished: boolean;
  isOpen: boolean;
  organizationId: string; 
  eventId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Obtener todas las encuestas
export const fetchSurveys = async (): Promise<Survey[]> => {
  try {
    const response = await api.get("/surveys");
    return response.data as Survey[]; 
  } catch (error) {
    console.error("Error al obtener las encuestas:", error);
    throw error;
  }
};

// Obtener una encuesta por ID
export const fetchSurveyById = async (id: string): Promise<Survey> => {
  try {
    const response = await api.get(`/surveys/${id}`);
    return response.data as Survey; 
  } catch (error) {
    console.error(`Error al obtener la encuesta con ID ${id}:`, error);
    throw error;
  }
};

// Crear una nueva encuesta
export const createSurvey = async (surveyData: Omit<Survey, '_id' | 'createdAt' | 'updatedAt'>): Promise<Survey> => {
  try {
    const response = await api.post("/surveys", surveyData);
    return response.data as Survey;
  } catch (error) {
    console.error("Error al crear la encuesta:", error);
    throw error;
  }
};

// Actualizar una encuesta por ID
export const updateSurvey = async (id: string, surveyData: Partial<Survey>): Promise<Survey> => {
  try {
    const response = await api.put(`/surveys/${id}`, surveyData);
    return response.data as Survey; 
  } catch (error) {
    console.error(`Error al actualizar la encuesta con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar una encuesta por ID
export const deleteSurvey = async (id: string): Promise<void> => {
  try {
    const response = await api.delete(`/surveys/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la encuesta con ID ${id}:`, error);
    throw error;
  }
};

// Buscar encuestas con filtros
export const searchSurveys = async (filters: any): Promise<any> => {
  try {
    const response = await api.get("/surveys/search", { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error al buscar encuestas con filtros:", error);
    throw error;
  }
};
