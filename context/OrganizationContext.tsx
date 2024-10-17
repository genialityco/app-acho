import React, { ReactNode, createContext, useState, useContext } from "react";

// Crear el contexto
export const OrganizationContext = createContext({
  organization: { _id: "" },
  updateOrganization: (newOrganization: any) => {},
});

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider = ({
  children,
}: OrganizationProviderProps) => {
  const [organization, setOrganization] = useState({
    _id: "66f1d236ee78a23c67fada2a",
  });

  // Función para actualizar la organización
  const updateOrganization = (newOrganization: React.SetStateAction<{ _id: string }>) => {
    setOrganization(newOrganization);
  };

  return (
    <OrganizationContext.Provider value={{ organization, updateOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  return useContext(OrganizationContext);
};
