import api from './api';

// Obtener todos los eventos
export const fetchEvents = async () => {
  try {
    const response = await api.get('/events');
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Obtener un evento por ID
export const fetchEventById = async (id: any) => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo evento
export const createEvent = async (eventData: any) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Actualizar un evento por ID
export const updateEvent = async (id: any, eventData: any) => {
  try {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un evento por ID
export const deleteEvent = async (id: any) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    throw error;
  }
};

// Buscar eventos con filtros
export const searchEvents = async (filters: any) => {
  try {
    const response = await api.get('/events/search', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching events with filters:', error);
    throw error;
  }
};
