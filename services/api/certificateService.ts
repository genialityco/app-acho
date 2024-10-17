// src/services/certificateService.js
import api from './api';  // Importa la instancia de Axios

// Obtener todos los certificados
export const fetchCertificates = async () => {
  try {
    const response = await api.get('/certificates');
    return response.data;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

// Obtener un certificado por ID
export const fetchCertificateById = async (id: any) => {
  try {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching certificate with ID ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo certificado
export const createCertificate = async (certificateData: any) => {
  try {
    const response = await api.post('/certificates', certificateData);
    return response.data;
  } catch (error) {
    console.error('Error creating certificate:', error);
    throw error;
  }
};

// Actualizar un certificado por ID
export const updateCertificate = async (id: any, certificateData: any) => {
  try {
    const response = await api.put(`/certificates/${id}`, certificateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating certificate with ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un certificado por ID
export const deleteCertificate = async (id: any) => {
  try {
    const response = await api.delete(`/certificates/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting certificate with ID ${id}:`, error);
    throw error;
  }
};

// Buscar certificados con filtros
export const searchCertificates = async (filters: any) => {
  try {
    const response = await api.get('/certificates/search', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching certificates with filters:', error);
    throw error;
  }
};
