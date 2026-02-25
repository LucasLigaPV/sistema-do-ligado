import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, CheckCircle2, Wrench, FileSignature, CreditCard } from "lucide-react";

export default function ModalSubetapas({ 
  open, 
  onOpenChange, 
  selectedSubetapa, 
  setSelectedSubetapa,
  onConfirm,
  onCancel 
}) {
  const subetapas = [
    { key: "aguardando_vistoria", label: "Aguardando Vistoria", icon: Wrench, color: "blue" },
    { key: "aguardando_assinatura", label: "Aguardando Assinatura", icon: FileSignature, color: "purple" },
    { key: "aguardando_pix", label: "Aguardando Pix", icon: CreditCard, color: "emerald" }
  ];

  const colorClasses = {
    blue: {
      checked: "bg-blue-50 border-blue-300 shadow-blue-100",
      unchecked: "bg-white border-slate-200 hover:border-slate-300",
      icon: "text-blue-600",
      iconBg: "bg-blue-100"
    },
    purple: {
      checked: "bg-purple-50 border-purple-300 shadow-purple-100",
      unchecked: "bg-white border-slate-200 hover:border-slate-300",
      icon: "text-purple-600",
      iconBg: "bg-purple-100"
    },
    emerald: {
      checked: "bg-emerald-50 border-emerald-300 shadow-emerald-100",
      unchecked: "bg-white border-slate-200 hover:border-slate-300",
      icon: "text-emerald-600",
      iconBg: "bg-emerald-100"
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">Etapa de Finalização</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-700 font-medium">
              Selecione os status pendentes para esta negociação:
            </p>
          </div>

          <div className="space-y-3">
            {subetapas.map((item) => {
              const IconComponent = item.icon;
              const isChecked = selectedSubetapa.includes(item.key);
              const colors = colorClasses[item.color];
              
              const toggleSubetapa = () => {
                setSelectedSubetapa(
                  isChecked
                    ? selectedSubetapa.filter(s => s !== item.key)
                    : [...selectedSubetapa, item.key]
                );
              };

              return (
                <div 
                  key={item.key} 
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isChecked 
                      ? `${colors.checked} shadow-lg scale-[1.02]` 
                      : `${colors.unchecked} hover:shadow-md`
                  }`}
                  onClick={toggleSubetapa}
                >
                  <Checkbox
                    id={`modal-${item.key}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      setSelectedSubetapa(checked
                        ? [...selectedSubetapa, item.key]
                        : selectedSubetapa.filter(s => s !== item.key)
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] flex-shrink-0 ${isChecked ? "ring-2 ring-[#EFC200] ring-offset-2" : ""}`}
                  />
                  <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0 transition-transform ${isChecked ? "scale-110" : ""}`}>
                    <IconComponent className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-base font-semibold transition-colors ${isChecked ? "text-slate-900" : "text-slate-700"}`}>
                      {item.label}
                    </p>
                  </div>
                  {isChecked && <CheckCircle2 className="w-6 h-6 text-[#EFC200] flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12 text-base"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 h-12 text-base font-semibold ${
                selectedSubetapa.length === 0 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-[#EFC200] hover:bg-[#D4A900] shadow-lg"
              } text-black`}
              disabled={selectedSubetapa.length === 0}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Seleção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}