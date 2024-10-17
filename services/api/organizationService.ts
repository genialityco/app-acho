import api from './api';

export interface InterfaceOrganization {
  name: string;
  propertiesDefinition: any[];
}

// Obtener todas las organizaciones
export const fetchOrganizations = async () => {
  try {
    const response = await api.get('/organizations');
    return response.data;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

// Obtener una organización por ID
export const fetchOrganizationById = async (id: any) => {
  try {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching organization with ID ${id}:`, error);
    throw error;
  }
};

// Crear una nueva organización
export const createOrganization = async (organizationData: any) => {
  try {
    const response = await api.post('/organizations', organizationData);
    return response.data;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

// Actualizar una organización por ID
export const updateOrganization = async (id: any, organizationData: any) => {
  try {
    const response = await api.put(`/organizations/${id}`, organizationData);
    return response.data;
  } catch (error) {
    console.error(`Error updating organization with ID ${id}:`, error);
    throw error;
  }
};

// Eliminar una organización por ID
export const deleteOrganization = async (id: any) => {
  try {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting organization with ID ${id}:`, error);
    throw error;
  }
};

// Buscar organizaciones con filtros
export const searchOrganizations = async (filters: any) => {
  try {
    const response = await api.get('/organizations/search', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching organizations with filters:', error);
    throw error;
  }
};
