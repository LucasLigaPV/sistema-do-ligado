import React, { useState, useMemo, useCallback } from "react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertCircle, Clock, Eye, XCircle, CheckCircle2, ThumbsUp, Car, FileText, Upload, Wrench, FileSignature, CreditCard, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import PainelEstatisticasAprovacoes from "./PainelEstatisticasAprovacoes";

export default function KanbanAprovacoes({ userEmail, userFuncao }) {
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const negociacoesAnalise = useMemo(() => 
    negociacoes.filter(n => 
      n.informacoes_conferidas && 
      n.etapa === "enviado_cadastro" &&
      n.status_aprovacao !== "aprovado"
    ), 
    [negociacoes]
  );

  const negociacoesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return negociacoesAnalise;
    
    const termo = searchTerm.toLowerCase();
    return negociacoesAnalise.filter(n => 
      n.nome_cliente?.toLowerCase().includes(termo) ||
      n.placa?.toLowerCase().includes(termo) ||
      n.telefone?.includes(termo) ||
      n.email?.toLowerCase().includes(termo) ||
      getNomeVendedor(n.vendedor_email)?.toLowerCase().includes(termo)
    );
  }, [negociacoesAnalise, searchTerm, getNomeVendedor]);

  const etapas = useMemo(() => [
    { id: "aguardando", label: "Aguardando Análise", icon: Clock },
    { id: "analisando", label: "Analisando", icon: Eye },
    { id: "reprovado", label: "Reprovado", icon: XCircle },
    { id: "corrigido", label: "Corrigidos", icon: CheckCircle2 },
    { id: "aprovado", label: "Aprovados", icon: ThumbsUp },
  ], []);

  const categoriesMotivo = useMemo(() => ({
    documentacao: "Documentação",
    contrato: "Contrato",
    vistoria_fotos: "Vistoria - Fotos",
    vistoria_videos: "Vistoria - Vídeos",
    preenchimento: "Preenchimento",
  }), []);

  const userMap = useMemo(() => 
    Object.fromEntries(users.map(u => [u.email, u.full_name])), 
    [users]
  );

  const getNomeVendedor = useCallback((email) => {
    return userMap[email] || email;
  }, [userMap]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const deal = negociacoes.find(n => n.id === dealId);

    if (!deal) return;

    if (newStatus === "reprovado") {
      setSelectedDeal(deal);
      setShowModal(true);
      return;
    }

    const updateData = {
      id: dealId,
      data: {}
    };

    if (newStatus === "corrigido") {
      updateData.data = {
        status_aprovacao: "corrigido",
        etapa: "enviado_cadastro",
        informacoes_conferidas: false,
      };
    } else if (newStatus === "aprovado") {
      updateData.data = {
        status_aprovacao: "aprovado",
        etapa: "venda_ativa",
        aprovado_por: userEmail,
        data_aprovacao: new Date().toISOString(),
      };
    } else if (newStatus === "analisando") {
      updateData.data = {
        status_aprovacao: "analisando",
        analisado_por: userEmail,
        data_analise: new Date().toISOString(),
      };
    }

    updateMutation.mutate(updateData);
  }, [negociacoes, userEmail, updateMutation]);

  const handleReprovar = useCallback(() => {
    if (!selectedDeal || !categoria || !motivo) {
      alert("Preencha todos os campos");
      return;
    }

    updateMutation.mutate({
      id: selectedDeal.id,
      data: {
        status_aprovacao: "reprovado",
        etapa: "enviado_cadastro",
        motivo_reprova_categoria: categoria,
        motivo_reprova_detalhe: motivo,
        analisado_por: userEmail,
        data_analise: new Date().toISOString(),
      }
    });
  }, [selectedDeal, categoria, motivo, userEmail, updateMutation]);

  const handleCardClick = useCallback((deal) => {
    setSelectedDeal(deal);
    setShowDetails(true);
  }, []);

  const historicoReprov = useMemo(() => 
    selectedDeal 
      ? negociacoes
          .filter(n => 
            n.nome_cliente === selectedDeal.nome_cliente && 
            n.motivo_reprova_categoria
          )
          .sort((a, b) => new Date(b.data_analise) - new Date(a.data_analise))
      : [],
    [negociacoes, selectedDeal?.nome_cliente]
  );

  return (
    <div className="space-y-6">
      <PainelEstatisticasAprovacoes negociacoes={negociacoes} />

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente, placa, telefone, email ou consultor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd} enableDefaultSensors={true}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {etapas.map((etapa) => {
              const dealsNaEtapa = useMemo(() => 
                negociacoesFiltradas.filter(n => n.status_aprovacao === etapa.id),
                [negociacoesFiltradas, etapa.id]
              );
              const IconComponent = etapa.icon;

              return (
                <Droppable key={etapa.id} droppableId={etapa.id} type="DEAL">
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
                            <Draggable key={`deal-${deal.id}`} draggableId={deal.id} index={index} type="DEAL">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <Card
                                    className={`bg-white cursor-pointer hover:shadow-md ${
                                      snapshot.isDragging ? "shadow-lg" : ""
                                    }`}
                                    onClick={() => handleCardClick(deal)}
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

      {/* Modal: Reprova */}
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

      {/* Sheet: Detalhes da Negociação */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Negociação</SheetTitle>
          </SheetHeader>
          {selectedDeal && (
            <div className="space-y-6 mt-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-500">Cliente</Label>
                  <p className="text-sm font-medium text-slate-900">{selectedDeal.nome_cliente}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-500">Telefone</Label>
                    <p className="text-sm text-slate-900">{selectedDeal.telefone}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-500">Email</Label>
                    <p className="text-sm text-slate-900">{selectedDeal.email || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-500">Placa</Label>
                    <p className="text-sm font-semibold text-[#EFC200]">{selectedDeal.placa || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-500">Modelo</Label>
                    <p className="text-sm text-slate-900">{selectedDeal.modelo_veiculo || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Negociação */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Informações da Negociação</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Plano</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.plano_interesse || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Origem</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.origem || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Valor Adesão</Label>
                      <p className="text-sm font-medium text-slate-900">{selectedDeal.valor_adesao || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Valor Mensalidade</Label>
                      <p className="text-sm font-medium text-slate-900">{selectedDeal.valor_mensalidade || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Data de Entrada</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.data_entrada ? format(new Date(selectedDeal.data_entrada), "dd/MM/yyyy") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Etapa</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.etapa || "-"}</p>
                    </div>
                  </div>
                  {selectedDeal.observacoes && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Observações</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Análise */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Análise e Aprovação</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Status</Label>
                      <Badge className="mt-1 bg-slate-100 text-slate-800 border-slate-200 capitalize">
                        {selectedDeal.status_aprovacao || "aguardando"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Consultor</Label>
                      <p className="text-sm text-slate-900">{getNomeVendedor(selectedDeal.vendedor_email) || "-"}</p>
                    </div>
                  </div>
                  {selectedDeal.analisado_por && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Analisado Por</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.analisado_por}</p>
                    </div>
                  )}
                  {selectedDeal.data_analise && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Data de Análise</Label>
                      <p className="text-sm text-slate-900">{format(new Date(selectedDeal.data_analise), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  )}
                  {selectedDeal.aprovado_por && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Aprovado Por</Label>
                      <p className="text-sm text-slate-900">{selectedDeal.aprovado_por}</p>
                    </div>
                  )}
                  {selectedDeal.data_aprovacao && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500">Data de Aprovação</Label>
                      <p className="text-sm text-slate-900">{format(new Date(selectedDeal.data_aprovacao), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#EFC200]" />
                  Checklist do Consultor
                </h3>
                <div className="space-y-2.5">
                  {[
                    { key: "cadastro_preenchido_power", label: "Cadastro Preenchido na Power", icon: FileText },
                    { key: "documentacoes_enviadas_power", label: "Documentações Enviadas", icon: Upload },
                    { key: "vistoria_realizada", label: "Vistoria Realizada", icon: Wrench },
                    { key: "contrato_assinado", label: "Contrato Assinado", icon: FileSignature },
                    { key: "pagamento_realizado", label: "Pagamento Realizado", icon: CreditCard }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isChecked = selectedDeal[item.key] || false;
                    return (
                      <div 
                        key={item.key} 
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isChecked 
                            ? "bg-green-50 border border-green-200" 
                            : "bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <IconComponent className={`w-4 h-4 flex-shrink-0 ${isChecked ? "text-green-600" : "text-slate-400"}`} />
                        <span className={`text-sm flex-1 font-medium ${isChecked ? "text-green-700" : "text-slate-700"}`}>
                          {item.label}
                        </span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Histórico de Reprovas */}
              {historicoReprov.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    Histórico de Reprovas
                  </h3>
                  <div className="space-y-3">
                    {historicoReprov.map((rep, index) => (
                      <div key={rep.id} className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-red-700">
                              {categoriesMotivo[rep.motivo_reprova_categoria]}
                            </p>
                            <p className="text-xs text-red-600 mt-1">{rep.motivo_reprova_detalhe}</p>
                          </div>
                          <span className="text-xs text-red-600 flex-shrink-0">
                            {format(new Date(rep.data_analise), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}