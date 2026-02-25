import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function NavegacaoEtapas({ 
  etapas, 
  etapaAtual, 
  onAvancar, 
  onVoltar,
  isEtapaFinal 
}) {
  if (isEtapaFinal) return null;

  const currentIndex = etapas.findIndex(e => e.id === etapaAtual);
  const nextEtapa = currentIndex < etapas.length - 1 ? etapas[currentIndex + 1] : null;
  const prevEtapa = currentIndex > 0 ? etapas[currentIndex - 1] : null;
  const NextIcon = nextEtapa?.icon;

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
      <Button
        variant="outline"
        onClick={onVoltar}
        disabled={!prevEtapa}
        className="flex items-center gap-2 text-sm h-9 disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar Etapa
      </Button>

      {nextEtapa && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Próxima:</span>
          {NextIcon && <NextIcon className="w-3.5 h-3.5" />}
          <span className="font-medium">{nextEtapa.label}</span>
        </div>
      )}

      <Button
        onClick={onAvancar}
        disabled={!nextEtapa}
        className="flex items-center gap-2 bg-[#EFC200] hover:bg-[#D4A900] text-black text-sm h-9 disabled:opacity-30"
      >
        Avançar Etapa
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}