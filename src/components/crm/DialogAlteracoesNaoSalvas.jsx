import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DialogAlteracoesNaoSalvas({ 
  open, 
  onOpenChange, 
  onDiscard, 
  onSave,
  saveDisabled 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Alterações Não Salvas
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-700">
            Você tem alterações não salvas. Deseja salvar antes de fechar?
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onDiscard}
            className="flex-1"
          >
            Descartar
          </Button>
          <Button
            className="flex-1 bg-[#EFC200] hover:bg-[#D4A900] text-black"
            onClick={onSave}
            disabled={saveDisabled}
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}