import React, { ReactNode, createContext, useState, useContext } from "react";

// Definir el tipo para el certificado
export interface Certificate {
  _id: string;
  userId: string;
  eventId: any;
  memberId: any;
  attended: boolean;
  certificationHours: string;
  typeAttendee: string;
  certificateDownloads?: number;
  createdAt: string;
  updatedAt: string;
}

// Definir el tipo para el contexto
interface CertificateContextType {
  certificates: Certificate[];
  currentCertificate: Certificate | null;
  loading: boolean;
  error: string | null;
  setCertificates: (certificates: Certificate[]) => void;
  setCurrentCertificate: (certificate: Certificate | null) => void;
  addCertificate: (certificate: Certificate) => void;
  removeCertificate: (certificateId: string) => void;
  updateCertificate: (certificateId: string, updates: Partial<Certificate>) => void;
  clearCertificates: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Crear el contexto con valores por defecto
export const CertificateContext = createContext<CertificateContextType>({
  certificates: [],
  currentCertificate: null,
  loading: false,
  error: null,
  setCertificates: () => {},
  setCurrentCertificate: () => {},
  addCertificate: () => {},
  removeCertificate: () => {},
  updateCertificate: () => {},
  clearCertificates: () => {},
  setLoading: () => {},
  setError: () => {},
});

interface CertificateProviderProps {
  children: ReactNode;
}

export const CertificateProvider = ({ children }: CertificateProviderProps) => {
  const [certificates, setCertificatesState] = useState<Certificate[]>([]);
  const [currentCertificate, setCurrentCertificateState] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para establecer todos los certificados
  const setCertificates = (newCertificates: Certificate[]) => {
    setCertificatesState(newCertificates);
  };

  // Función para establecer el certificado actual
  const setCurrentCertificate = (certificate: Certificate | null) => {
    setCurrentCertificateState(certificate);
  };

  // Función para agregar un certificado
  const addCertificate = (certificate: Certificate) => {
    setCertificatesState((prev) => {
      // Evitar duplicados
      const exists = prev.some((cert) => cert._id === certificate._id);
      if (exists) {
        return prev;
      }
      return [...prev, certificate];
    });
  };

  // Función para eliminar un certificado
  const removeCertificate = (certificateId: string) => {
    setCertificatesState((prev) => prev.filter((cert) => cert._id !== certificateId));
    
    // Si el certificado eliminado es el actual, limpiarlo
    if (currentCertificate?._id === certificateId) {
      setCurrentCertificateState(null);
    }
  };

  // Función para actualizar un certificado
  const updateCertificate = (certificateId: string, updates: Partial<Certificate>) => {
    setCertificatesState((prev) =>
      prev.map((cert) =>
        cert._id === certificateId ? { ...cert, ...updates } : cert
      )
    );

    // Si el certificado actualizado es el actual, actualizarlo también
    if (currentCertificate?._id === certificateId) {
      setCurrentCertificateState((prev) =>
        prev ? { ...prev, ...updates } : null
      );
    }
  };

  // Función para limpiar todos los certificados
  const clearCertificates = () => {
    setCertificatesState([]);
    setCurrentCertificateState(null);
    setError(null);
  };

  const value: CertificateContextType = {
    certificates,
    currentCertificate,
    loading,
    error,
    setCertificates,
    setCurrentCertificate,
    addCertificate,
    removeCertificate,
    updateCertificate,
    clearCertificates,
    setLoading,
    setError,
  };

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useCertificate = () => {
  const context = useContext(CertificateContext);
  
  if (!context) {
    throw new Error("useCertificate debe ser usado dentro de CertificateProvider");
  }
  
  return context;
};