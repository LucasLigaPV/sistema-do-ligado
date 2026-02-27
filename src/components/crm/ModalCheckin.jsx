import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ModalCheckin({ userEmail, open, onOpenChange }) {
  const queryClient = useQueryClient();

  const { data: checkins = [] } = useQuery({
    queryKey: ["checkins", userEmail],
    queryFn: () => base44.entities.Checkin.filter({ usuario_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => base44.entities.ConfiguracaoDistribuicao.list(),
  });

  const createCheckinMutation = useMutation({
    mutationFn: (data) => base44.entities.Checkin.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
    },
  });



  const handleCheckin = () => {
    const agora = new Date();
    const hora = format(agora, "HH:mm");
    const data = format(agora, "yyyy-MM-dd");
    const diaSemana = format(agora, "EEEE", { locale: ptBR });
    
    // Buscar horários das configurações
    const horarioSemanaConfig = configs.find(c => c.tipo === "horario_limite_semana");
    const horarioSabadoConfig = configs.find(c => c.tipo === "horario_limite_sabado");
    
    const horarioLimiteSemana = horarioSemanaConfig?.valor || "10:31";
    const horarioLimiteSabado = horarioSabadoConfig?.valor || "10:30";
    
    // Verificar se está dentro do prazo
    const [horaAtual, minutoAtual] = hora.split(":").map(Number);
    const isDomingo = agora.getDay() === 0;
    const isSabado = agora.getDay() === 6;
    
    let dentroPrazo = false;
    if (!isDomingo) {
      if (isSabado) {
        const [limiteHora, limiteMinuto] = horarioLimiteSabado.split(":").map(Number);
        dentroPrazo = horaAtual < limiteHora || (horaAtual === limiteHora && minutoAtual <= limiteMinuto);
      } else {
        const [limiteHora, limiteMinuto] = horarioLimiteSemana.split(":").map(Number);
        dentroPrazo = horaAtual < limiteHora || (horaAtual === limiteHora && minutoAtual <= limiteMinuto);
      }
    }

    createCheckinMutation.mutate({
      usuario_email: userEmail,
      data,
      hora,
      dentro_prazo: dentroPrazo,
      dia_semana: diaSemana,
    });
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            Recepção de Leads
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-medium">
                  {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-bold text-[#EFC200]">
                  {format(new Date(), "HH:mm")}
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              Registre sua presença para receber leads hoje
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-2">⏰ Horários Limite:</p>
            <ul className="space-y-1 text-xs">
              <li>• Segunda a Sexta: <strong>{configs.find(c => c.tipo === "horario_limite_semana")?.valor || "10:31"}</strong></li>
              <li>• Sábado: <strong>{configs.find(c => c.tipo === "horario_limite_sabado")?.valor || "10:30"}</strong> (máx. {configs.find(c => c.tipo === "limite_leads_sabado")?.valor || "5"} leads)</li>
              <li>• Domingo: Sem distribuição</li>
            </ul>
          </div>

          <Button
            onClick={handleCheckin}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
            disabled={createCheckinMutation.isPending}
          >
            {createCheckinMutation.isPending ? (
              "Registrando..."
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Pronto para receber Leads
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}