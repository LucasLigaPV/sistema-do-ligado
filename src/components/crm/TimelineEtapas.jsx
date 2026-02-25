import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TimelineEtapas({ 
  etapas, 
  etapaAtual, 
  onEtapaClick, 
  isReadOnly 
}) {
  const etapasVisiveis = etapas;
  const currentIndex = etapasVisiveis.findIndex(e => e.id === etapaAtual);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, etapaId: null, etapaLabel: "" });

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-2">
        <div className="w-1 h-5 bg-[#EFC200] rounded-full"></div>
        Etapas do Processo
      </h3>
      {!isReadOnly && (
        <p className="text-[10px] text-slate-400 mb-4 italic">Clique em uma etapa para mudar rapidamente</p>
      )}
      <div className="relative">
        {etapasVisiveis.map((etapa, index) => {
          const IconComponent = etapa.icon;
          const isCurrentEtapa = etapaAtual === etapa.id;
          const isPassed = index < currentIndex;
          const isFuture = index > currentIndex;
          const isLockedEtapa = etapa.id === "reprovado" || etapa.id === "venda_ativa";
          const isStuckInEnviado = etapaAtual === "enviado_cadastro" && etapa.id !== "enviado_cadastro";
          const canClick = !isReadOnly && !isLockedEtapa && !isStuckInEnviado;
          
          return (
            <div key={etapa.id} className="relative">
              {/* Linha conectora */}
              {index < etapasVisiveis.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ 
                    delay: 0.5 + index * 0.05,
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  className={`absolute w-0.5 origin-top ${
                    isPassed || isCurrentEtapa ? 'bg-gradient-to-b from-green-400 to-green-200' : 'bg-gradient-to-b from-slate-300 to-transparent'
                  }`} 
                  style={{ 
                    left: 'calc(0.75rem + 16px)', 
                    top: '2.5rem', 
                    height: '40px' 
                  }} 
                />
              )}
              
              {/* Item da etapa */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`relative flex items-start gap-3 py-2 px-3 rounded-lg mb-1 transition-all ${
                  canClick ? 'cursor-pointer hover:bg-white' : (isLockedEtapa || isStuckInEnviado) ? 'opacity-60 cursor-not-allowed' : ''
                } ${isCurrentEtapa ? 'bg-white shadow-sm' : ''}`}
                onClick={() => {
                  if (canClick && etapa.id !== etapaAtual) {
                    setConfirmDialog({ open: true, etapaId: etapa.id, etapaLabel: etapa.label });
                  }
                }}
              >
                {/* Bolinha indicadora */}
                <div className="flex-shrink-0">
                  {isCurrentEtapa ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(34, 197, 94, 0.7)",
                          "0 0 0 8px rgba(34, 197, 94, 0)",
                          "0 0 0 0 rgba(34, 197, 94, 0)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg"
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : isPassed ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-2 border-green-300">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <IconComponent className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                
                {/* Texto da etapa */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className={`text-xs font-semibold leading-tight ${
                    isCurrentEtapa ? 'text-green-700' : 
                    isPassed ? 'text-green-600' : 
                    'text-slate-500'
                  }`}>
                    {etapa.label}
                  </p>
                  {isCurrentEtapa && (
                    <p className="text-[10px] text-green-600 mt-0.5 font-medium">
                      Etapa atual
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
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
              onClick={() => setConfirmDialog({ open: false, etapaId: null, etapaLabel: "" })}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
              onClick={() => {
                onEtapaClick(confirmDialog.etapaId);
                setConfirmDialog({ open: false, etapaId: null, etapaLabel: "" });
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}