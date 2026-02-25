import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

export default function NavegacaoEtapas({ 
  etapas, 
  etapaAtual, 
  onAvancar, 
  onVoltar,
  isEtapaFinal 
}) {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, direction: null, etapaLabel: "" });

  if (isEtapaFinal) return null;

  const currentIndex = etapas.findIndex(e => e.id === etapaAtual);
  const nextEtapa = currentIndex < etapas.length - 1 ? etapas[currentIndex + 1] : null;
  const prevEtapa = currentIndex > 0 ? etapas[currentIndex - 1] : null;
  const NextIcon = nextEtapa?.icon;

  const handleAvancarClick = () => {
    if (nextEtapa) {
      setConfirmDialog({ open: true, direction: "avancar", etapaLabel: nextEtapa.label });
    }
  };

  const handleVoltarClick = () => {
    if (prevEtapa) {
      setConfirmDialog({ open: true, direction: "voltar", etapaLabel: prevEtapa.label });
    }
  };

  const handleConfirm = () => {
    if (confirmDialog.direction === "avancar") {
      onAvancar();
    } else if (confirmDialog.direction === "voltar") {
      onVoltar();
    }
    setConfirmDialog({ open: false, direction: null, etapaLabel: "" });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <Button
          variant="outline"
          onClick={handleVoltarClick}
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
          onClick={handleAvancarClick}
          disabled={!nextEtapa}
          className="flex items-center gap-2 bg-[#EFC200] hover:bg-[#D4A900] text-black text-sm h-9 disabled:opacity-30"
        >
          Avançar Etapa
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Confirmar Mudança de Etapa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-700">
              Deseja realmente mudar para a etapa <span className="font-semibold">{confirmDialog.etapaLabel}</span>?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, direction: null, etapaLabel: "" })}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
              onClick={handleConfirm}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}