import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import FormularioIndicacao from "../components/indicacao/FormularioIndicacao";

export default function Formulario() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          if (currentUser?.role === "admin") {
            window.location.href = createPageUrl("Admin");
            return;
          }
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserRole();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <FormularioIndicacao />;
}