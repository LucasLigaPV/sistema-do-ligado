import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AlertCircle, Clock, Eye, XCircle, CheckCircle2, ThumbsUp, Car } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import PainelEstatisticasAprovacoes from "./PainelEstatisticasAprovacoes";

export default function KanbanAprovacoes({ userEmail, userFuncao }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [categoria, setCategoria] = useState("");

  const queryClient = useQueryClient();

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negociacao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      setShowModal(false);
      setSelectedDeal(null);
      setMotivo("");
      setCategoria("");
    },
  });

  // Filtrar negociações em análise
  let negociacoesAnalise = negociacoes.filter(n => 
    n.informacoes_conferidas && 
    n.etapa === "enviado_cadastro" &&
    n.status_aprovacao !== "aprovado"
  );

  const etapas = [
    { id: "aguardando", label: "Aguardando Análise", icon: Clock },
    { id: "analisando", label: "Analisando", icon: Eye },
    { id: "reprovado", label: "Reprovado", icon: XCircle },
    { id: "corrigido", label: "Corrigidos", icon: CheckCircle2 },
    { id: "aprovado", label: "Aprovados", icon: ThumbsUp },
  ];

  const categoriesMotivo = {
    documentacao: "Documentação",
    contrato: "Contrato",
    vistoria_fotos: "Vistoria - Fotos",
    vistoria_videos: "Vistoria - Vídeos",
    preenchimento: "Preenchimento",
  };

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const deal = negociacoes.find(n => n.id === dealId);

    if (!deal) return;

    // Se for reprovar, abrir modal
    if (newStatus === "reprovado") {
      setSelectedDeal(deal);
      setShowModal(true);
      return;
    }

    // Se for corrigido, volta para enviado_cadastro na pipeline do vendedor
    if (newStatus === "corrigido") {
      updateMutation.mutate({
        id: dealId,
        data: {
          status_aprovacao: "corrigido",
          etapa: "enviado_cadastro",
          informacoes_conferidas: false,
        }
      });
      return;
    }

    // Se for aprovado
    if (newStatus === "aprovado") {
      updateMutation.mutate({
        id: dealId,
        data: {
          status_aprovacao: "aprovado",
          etapa: "venda_ativa",
          aprovado_por: userEmail,
          data_aprovacao: new Date().toISOString(),
        }
      });
      return;
    }

    // Para analisando
    if (newStatus === "analisando") {
      updateMutation.mutate({
        id: dealId,
        data: {
          status_aprovacao: "analisando",
          analisado_por: userEmail,
          data_analise: new Date().toISOString(),
        }
      });
    }
  };

  const handleReprovar = () => {
    if (!selectedDeal || !categoria || !motivo) {
      alert("Preencha todos os campos");
      return;
    }

    updateMutation.mutate({
      id: selectedDeal.id,
      data: {
        status_aprovacao: "reprovado",
        etapa: "reprovado",
        motivo_reprova_categoria: categoria,
        motivo_reprova_detalhe: motivo,
        analisado_por: userEmail,
        data_analise: new Date().toISOString(),
      }
    });
  };

  return (
    <div className="space-y-6">
      <PainelEstatisticasAprovacoes negociacoes={negociacoes} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {etapas.map((etapa) => {
              const dealsNaEtapa = negociacoesAnalise.filter(n => n.status_aprovacao === etapa.id);
              const IconComponent = etapa.icon;

              return (
                <Droppable key={etapa.id} droppableId={etapa.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-96 flex-shrink-0"
                    >
                      <Card className="bg-white shadow-sm border flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
                        <CardHeader className="pb-3 bg-slate-50/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-slate-600" />
                              <CardTitle className="text-sm font-semibold text-slate-700">
                                {etapa.label}
                              </CardTitle>
                            </div>
                            <Badge variant="secondary" className="bg-white border">
                              {dealsNaEtapa.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 flex-1 overflow-y-auto">
                          {dealsNaEtapa.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <Card
                                    className={`bg-white cursor-move hover:shadow-md ${
                                      snapshot.isDragging ? "shadow-lg" : ""
                                    }`}
                                  >
                                    <CardContent className="p-4 space-y-2">
                                      <div className="font-medium text-sm">
                                        {deal.nome_cliente}
                                      </div>
                                      {deal.placa && (
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[#EFC200]">
                                          <Car className="w-4 h-4" />
                                          {deal.placa}
                                        </div>
                                      )}
                                      <div className="flex justify-between text-xs text-slate-500 pt-1 border-t">
                                        <span>{getNomeVendedor(deal.vendedor_email)}</span>
                                        <span>{format(new Date(deal.data_conferencia), "dd/MM/yyyy")}</span>
                                      </div>
                                      {deal.motivo_reprova_categoria && (
                                        <div className="text-xs text-red-600 pt-2 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-2 mt-2 rounded-b">
                                          <strong>{categoriesMotivo[deal.motivo_reprova_categoria]}:</strong> {deal.motivo_reprova_detalhe}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Reprova</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">{selectedDeal.nome_cliente}</p>
                    <p className="text-sm text-red-800">{selectedDeal.placa}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Motivo da Reprova *</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documentacao">Documentação</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="vistoria_fotos">Vistoria - Fotos</SelectItem>
                    <SelectItem value="vistoria_videos">Vistoria - Vídeos</SelectItem>
                    <SelectItem value="preenchimento">Preenchimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Especificar Detalhe *</Label>
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva o motivo específico da reprova..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReprovar}
                  variant="destructive"
                  className="flex-1"
                  disabled={!categoria || !motivo}
                >
                  Reprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}