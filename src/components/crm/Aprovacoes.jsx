import React from "react";
import ApprovacoesMenu from "./ApprovacoesMenu";

export default function Aprovacoes({ userEmail, userFuncao }) {
  return <ApprovacoesMenu userEmail={userEmail} userFuncao={userFuncao} />;
}