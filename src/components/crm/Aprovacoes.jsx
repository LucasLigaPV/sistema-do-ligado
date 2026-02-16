import React from "react";
import ApprovacoesMenu from "./ApprovacoesMenu";

export default function Aprovacoes({ userEmail, userFuncao, activeTab = "avaliar" }) {
  return <ApprovacoesMenu userEmail={userEmail} userFuncao={userFuncao} activeTab={activeTab} />;
}