import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Eye, XCircle, CheckCircle2, ThumbsUp } from "lucide-react";

export default function PainelEstatisticasAprovacoes({ negociacoes }) {
  const etapas = [
    { id: "aguardando", label: "Aguardando", icon: Clock },
    { id: "analisando", label: "Analisando", icon: Eye },
    { id: "reprovado", label: "Reprovado", icon: XCircle },
    { id: "corrigido", label: "Corrigidos", icon: CheckCircle2 },
    { id: "aprovado", label: "Aprovados", icon: ThumbsUp },
  ];

  const negociacoesAnalise = negociacoes.filter(n => 
    n.informacoes_conferidas && 
    n.etapa === "enviado_cadastro" &&
    n.status_aprovacao !== "aprovado"
  );

  const totalNegociacoes = negociacoesAnalise.length;

  return (
    <div className="grid grid-cols-6 gap-3 mb-6">
      {etapas.map((etapa) => {
        const dealsNaEtapa = negociacoesAnalise.filter(n => n.status_aprovacao === etapa.id);
        const IconComponent = etapa.icon;

        return (
          <Card key={etapa.id} className="bg-white shadow-sm border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <IconComponent className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">{etapa.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{dealsNaEtapa.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Card className="bg-white shadow-sm border col-span-1 hidden lg:block">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <ThumbsUp className="w-4 h-4 text-[#EFC200]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Total</p>
              <p className="text-2xl font-bold text-slate-900">{totalNegociacoes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}