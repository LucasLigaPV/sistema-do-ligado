import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function Formulario() {
  useEffect(() => {
    window.location.href = createPageUrl("Admin");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
    </div>
  );
}