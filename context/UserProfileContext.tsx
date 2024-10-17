import React, { createContext, useContext, useState, useEffect } from "react";

// Crear el contexto de perfil
interface UserProfileContextType {
  profile: UserProfile | null;
  updateUserProfile: (updatedProfile: UserProfile) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | null>(null);

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

const getProfileFromAPI = async () => {
  // Simulación de la llamada a una API
  const apiResponse = {
    id: 1,
    fullName: "John Doe",
    email: "acho@acho.com",
    specialty: "Medicina General",
    idNumber: "123456789",
    phone: "1234567890",
  };

  return {
    id: apiResponse.id,
    name: apiResponse.fullName,
    email: apiResponse.email,
    phone: apiResponse.phone,
  };
};

const updateProfileInAPI = async (updatedProfile: any) => {
  // Simulación de la actualización en la API
  return {
    id: updatedProfile.id,
    name: updatedProfile.name,
    email: updatedProfile.email,
    phone: updatedProfile.phone,
  };
};

import { ReactNode } from "react";

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider = ({ children }: UserProfileProviderProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Aquí iría la lógica para cargar el perfil del usuario cuando la aplicación inicie
    const fetchProfile = async () => {
      const userProfile = await getProfileFromAPI();
      setProfile(userProfile);
    };

    fetchProfile();
  }, []);

  const updateUserProfile = async (updatedProfile: any) => {
    // Aquí iría la lógica para actualizar el perfil del usuario
    const updated = await updateProfileInAPI(updatedProfile);
    setProfile(updated);
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateUserProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Hook para usar el contexto
export const useUserProfile = () => useContext(UserProfileContext);
