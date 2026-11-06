import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { searchMembers } from "@/services/api/memberService";

// Cédula (properties.idNumber) del miembro del usuario logueado; null mientras carga o si no tiene.
export function useMemberIdNumber(): string | null {
  const { userId } = useAuth();
  const [idNumber, setIdNumber] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIdNumber(null);
    if (!userId) return;
    searchMembers({ userId })
      .then((response) => {
        const value = response?.data?.items?.[0]?.properties?.idNumber;
        if (!cancelled && value) setIdNumber(String(value).trim());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return idNumber;
}
