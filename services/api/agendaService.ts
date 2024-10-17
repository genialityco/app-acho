import api from './api';

// Obtener todas las agendas
export const fetchAgendas = async () => {
  try {
    const response = await api.get('/agendas');
    return response.data;
  } catch (error) {
    console.error('Error fetching agendas:', error);
    throw error;
  }
};

// Obtener una agenda por ID
export const fetchAgendaById = async (id: string) => {
  try {
    const response = await api.get(`/agendas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching agenda with ID ${id}:`, error);
    throw error;
  }
};

// Crear una nueva agenda
export const createAgenda = async (agendaData: any) => {
  try {
    const response = await api.post('/agendas', agendaData);
    return response.data;
  } catch (error) {
    console.error('Error creating agenda:', error);
    throw error;
  }
};

// Actualizar una agenda por ID
export const updateAgenda = async (id: string, agendaData: any) => {
  try {
    const response = await api.put(`/agendas/${id}`, agendaData);
    return response.data;
  } catch (error) {
    console.error(`Error updating agenda with ID ${id}:`, error);
    throw error;
  }
};

// Eliminar una agenda por ID
export const deleteAgenda = async (id: string) => {
  try {
    const response = await api.delete(`/agendas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting agenda with ID ${id}:`, error);
    throw error;
  }
};

// Buscar agendas con filtros
export const searchAgendas = async (filters: any) => {
  try {
    const response = await api.get('/agendas/search', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching agendas with filters:', error);
    throw error;
  }
};

// Obtener la agenda de un evento por día
export const fetchAgendaByDay = async (eventId: string, day: number) => {
  try {
    const response = await api.get(`/agendas/agenda/${eventId}/day/${day}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching agenda for day ${day}:`, error);
    throw error;
  }
};
