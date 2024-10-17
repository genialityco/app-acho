import api from "./api";

export interface DocumentInterface {
  _id: string;
  name: string;
  description: string;
  event: string;
  documentUrl: string;
}

// Obtener todos los documentos
export const fetchDocuments = async () => {
  try {
    const response = await api.get("/documents");
    return response.data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

// Obtener un documento por ID
export const fetchDocumentById = async (id: Partial<DocumentInterface>) => {
  try {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document with ID ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo documento
export const createDocument = async (
  documentData: Partial<DocumentInterface>
) => {
  try {
    const response = await api.post("/documents", documentData);
    return response.data;
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};

// Actualizar un documento por ID
export const updateDocument = async (
  id: string,
  documentData: Partial<DocumentInterface>
) => {
  try {
    const response = await api.put(`/documents/${id}`, documentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating document with ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un documento por ID
export const deleteDocument = async (id: string) => {
  try {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting document with ID ${id}:`, error);
    throw error;
  }
};

// Buscar documentos con filtros
export const searchDocuments = async (filters: any) => {
  try {
    const response = await api.get("/documents/search", { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error searching documents with filters:", error);
    throw error;
  }
};
