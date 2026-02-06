import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ModalCheckin({ userEmail }) {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: checkins = [] } = useQuery({
    queryKey: ["checkins", userEmail],
    queryFn: () => base44.entities.Checkin.list(),
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => base44.entities.ConfiguracaoDistribuicao.list(),
  });

  const createCheckinMutation = useMutation({
    mutationFn: (data) => base44.entities.Checkin.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      setShowModal(false);
    },
  });

  useEffect(() => {
    if (!userEmail) return;
    
    // Verificar se já fez check-in hoje
    const hoje = format(new Date(), "yyyy-MM-dd");
    const checkinHoje = checkins.find(
      (c) => c.usuario_email === userEmail && c.data === hoje
    );

    // Verificar se já mostrou o modal hoje na sessão atual
    const modalMostradoHoje = sessionStorage.getItem(`checkin_modal_${hoje}`);

    if (!checkinHoje && !modalMostradoHoje) {
      setShowModal(true);
      sessionStorage.setItem(`checkin_modal_${hoje}`, "true");
    }
  }, [checkins, userEmail]);

  const handleCheckin = () => {
    const agora = new Date();
    const hora = format(agora, "HH:mm");
    const data = format(agora, "yyyy-MM-dd");
    const diaSemana = format(agora, "EEEE", { locale: ptBR });
    
    // Verificar se está dentro do prazo
    const [horaAtual, minutoAtual] = hora.split(":").map(Number);
    const isDomingo = agora.getDay() === 0;
    const isSabado = agora.getDay() === 6;
    
    let dentroPrazo = false;
    if (!isDomingo) {
      if (isSabado) {
        dentroPrazo = horaAtual < 10 || (horaAtual === 10 && minutoAtual <= 30);
      } else {
        dentroPrazo = horaAtual < 10 || (horaAtual === 10 && minutoAtual <= 31);
      }
    }

    createCheckinMutation.mutate({
      usuario_email: userEmail,
      data,
      hora,
      dentro_prazo: dentroPrazo,
      dia_semana: diaSemana,
    });
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            Check-in Diário
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
              <li>• Segunda a Sexta: <strong>10h31</strong></li>
              <li>• Sábado: <strong>10h30</strong> (máx. 5 leads)</li>
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
                Fazer Check-in
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}