import React from "react";
import KanbanAprovacoes from "./KanbanAprovacoes";
import DashboardAprovacoes from "./DashboardAprovacoes";

export default function ApprovacoesMenu({ userEmail, userFuncao, activeTab = "avaliar" }) {
  return (
    <div className="space-y-6">
      {activeTab === "avaliar" && (
        <KanbanAprovacoes userEmail={userEmail} userFuncao={userFuncao} />
      )}
      {activeTab === "dashboard" && (
        <DashboardAprovacoes />
      )}
    </div>
  );
}