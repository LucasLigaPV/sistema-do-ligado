import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AlertCircle, Clock, Eye, XCircle, CheckCircle2, ThumbsUp, Car, FileText, Upload, Wrench, FileSignature, CreditCard, Search, X, Plus, History, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfMonth, endOfMonth } from "date-fns";
import PainelEstatisticasAprovacoes from "./PainelEstatisticasAprovacoes";
import AnexosReprova from "./AnexosReprova";

export default function KanbanAprovacoes({ userEmail, userFuncao }) {
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [motivosReprova, setMotivosReprova] = useState([{ categoria: "", detalhe: "" }]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);
  const [showConfirmAtivar, setShowConfirmAtivar] = useState(false);
  const [dealParaAtivar, setDealParaAtivar] = useState(null);
  
  // Filtro de data - padrão: 7 dias atrás até 1 dia à frente
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return format(d, "yyyy-MM-dd"); });
  const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return format(d, "yyyy-MM-dd"); });

  const queryClient = useQueryClient();
  const prevAguardandoIds = useRef(null);

  // Som de notificação via Web Audio API (estilo WhatsApp Web)
  const playNotificationSound = useCallback(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sequence = [
      { freq: 440, start: 0, duration: 0.18 },
      { freq: 554, start: 0.2, duration: 0.35 },
    ];
    sequence.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });
  }, []);

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  // Subscrição em tempo real para novas movimentações
  useEffect(() => {
    const unsubscribe = base44.entities.Negociacao.subscribe((event) => {
      queryClient.setQueryData(["negociacoes"], (old = []) => {
        if (event.type === "create") {
          return [...old, event.data];
        } else if (event.type === "update") {
          return old.map(n => n.id === event.id ? event.data : n);
        } else if (event.type === "delete") {
          return old.filter(n => n.id !== event.id);
        }
        return old;
      });
    });
    return unsubscribe;
  }, [queryClient]);

  // Detectar novas vendas enviadas para aprovação e tocar som
  useEffect(() => {
    const aguardandoIds = negociacoes
      .filter(n => n.informacoes_conferidas && n.status_aprovacao === "aguardando")
      .map(n => n.id);

    if (prevAguardandoIds.current !== null) {
      const novas = aguardandoIds.filter(id => !prevAguardandoIds.current.includes(id));
      if (novas.length > 0) {
        playNotificationSound();
      }
    }
    prevAguardandoIds.current = aguardandoIds;
  }, [negociacoes, playNotificationSound]);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.Negociacao.update(id, data);
      
      // Se aprovado, cria registro na Venda
      if (data.status_aprovacao === "aprovado") {
        if (!data.data_venda_ativa) {
          data.data_venda_ativa = new Date().toISOString();
        }
        const deal = negociacoes.find(n => n.id === id);
        if (deal) {
          await base44.entities.Venda.create({
            vendedor: getNomeVendedor(deal.vendedor_email),
            email_vendedor: deal.vendedor_email,
            data_venda: deal.data_venda_ativa || data.data_venda_ativa || new Date().toISOString(),
            etapa: "pagamento_ok",
            cliente: deal.nome_cliente,
            telefone: deal.telefone,
            email: deal.email || "",
            plano_vendido: deal.plano_interesse || "",
            placa: deal.placa || "",
            modelo_veiculo: deal.modelo_veiculo || "",
            valor_adesao: deal.valor_adesao || "",
            valor_mensalidade: deal.valor_mensalidade || "",
            forma_pagamento: "pix",
            canal_venda: deal.origem || "lead",
            tem_indicacao: (deal.origem === "indicacao" || deal.origem === "troca_titularidade") ? "sim" : "nao",
            plataforma: deal.plataforma || "",
            posicionamento: deal.posicionamento || "",
            ad: deal.ad || "",
            adset: deal.adset || "",
            campanha: deal.campanha || "",
            pagina: deal.pagina || "",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      setShowModal(false);
      setSelectedDeal(null);
      setMotivosReprova([{ categoria: "", detalhe: "" }]);
    },
  });

  const userMap = useMemo(() => 
    Object.fromEntries(users.map(u => [u.email, u.full_name])), 
    [users]
  );

  const getNomeVendedor = useCallback((email) => {
    return userMap[email] || email;
  }, [userMap]);

  const negociacoesAnalise = useMemo(() => 
    negociacoes.filter(n => {
      if (!n.informacoes_conferidas) return false;
      if (!(n.etapa === "enviado_cadastro" || n.status_aprovacao === "reprovado" || n.status_aprovacao === "corrigido" || n.status_aprovacao === "aprovado" || n.status_aprovacao === "aguardando_termo")) return false;
      
      // Filtro de data: aguardando usa data_conferencia, analisando+ usa data_analise, aprovado usa data_aprovacao
      let dataParaFiltrar;
      if (n.status_aprovacao === "aguardando") {
        dataParaFiltrar = n.data_conferencia;
      } else if (n.status_aprovacao === "aprovado") {
        dataParaFiltrar = n.data_aprovacao || n.data_analise || n.data_conferencia;
      } else {
        // analisando, reprovado, corrigido
        dataParaFiltrar = n.data_analise || n.data_conferencia;
      }
      
      if (dataParaFiltrar) {
        const data = new Date(dataParaFiltrar);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        if (data < start || data > end) {
          return false;
        }
      }
      
      return true;
    }), 
    [negociacoes, startDate, endDate]
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
    { id: "aguardando_termo", label: "Aguardando Termo de Danos", icon: FileText },
    { id: "aprovado", label: "Aprovados", icon: ThumbsUp },
  ], []);

  const categoriesMotivo = useMemo(() => ({
    documentacao: "Documentação",
    contrato: "Contrato",
    vistoria_fotos: "Vistoria - Fotos",
    vistoria_videos: "Vistoria - Vídeos",
    preenchimento: "Preenchimento",
  }), []);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const deal = negociacoes.find(n => n.id === dealId);

    if (!deal) return;

    // Bloquear movimento se está em reprovado (apenas corrigido na pipeline de negociações é permitido)
    if (deal.status_aprovacao === "reprovado") {
      alert("Este card está reprovado. Corrija-o na Pipeline de Negociações antes de movê-lo aqui.");
      return;
    }

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
        data_venda_ativa: new Date().toISOString(),
      };
    } else if (newStatus === "analisando") {
      updateData.data = {
        status_aprovacao: "analisando",
        analisado_por: userEmail,
        data_analise: new Date().toISOString(),
      };
    } else if (newStatus === "aguardando_termo") {
      updateData.data = {
        status_aprovacao: "aguardando_termo",
      };
    }

    updateMutation.mutate(updateData);
  }, [negociacoes, userEmail, updateMutation]);

  const handleReprovar = useCallback(() => {
    if (!selectedDeal) {
      return;
    }

    const motivosValidos = motivosReprova.filter(m => m.categoria && m.detalhe);
    if (motivosValidos.length === 0) {
      alert("Adicione pelo menos um motivo de reprova");
      return;
    }

    const motivosFormatados = motivosValidos.map(m => ({
      categoria: m.categoria,
      detalhe: m.detalhe,
      corrigido: false
    }));

    // Adicionar ao histórico de reprovas
    const historicoAtual = selectedDeal.historico_reprovas || [];
    const novaReprova = {
      data_analise: new Date().toISOString(),
      analisado_por: userEmail,
      motivos: motivosFormatados
    };

    updateMutation.mutate({
      id: selectedDeal.id,
      data: {
        status_aprovacao: "reprovado",
        etapa: "reprovado",
        motivos_reprova: motivosFormatados,
        analisado_por: userEmail,
        data_analise: new Date().toISOString(),
        historico_reprovas: [novaReprova, ...historicoAtual]
      }
    });
  }, [selectedDeal, motivosReprova, userEmail, updateMutation]);

  const handleCardClick = useCallback((deal) => {
    setSelectedDeal(deal);
    setShowDetails(true);
  }, []);

  const historicoReprov = useMemo(() => 
    selectedDeal?.historico_reprovas || [],
    [selectedDeal?.historico_reprovas]
  );

  return (
    <div className="space-y-6">
      <PainelEstatisticasAprovacoes negociacoes={negociacoes} />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1">
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

        {/* Filtro de Data */}
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span className="text-sm text-slate-500">até</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
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
                            <Draggable key={`deal-${deal.id}`} draggableId={deal.id} index={index} type="DEAL" isDragDisabled={deal.status_aprovacao === "reprovado"}>
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
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>
                                            {deal.status_aprovacao === "aguardando" && deal.data_conferencia
                                              ? format(new Date(deal.data_conferencia), "dd/MM HH:mm")
                                              : deal.status_aprovacao === "aprovado" && deal.data_aprovacao
                                              ? format(new Date(deal.data_aprovacao), "dd/MM HH:mm")
                                              : deal.data_analise
                                              ? format(new Date(deal.data_analise), "dd/MM HH:mm")
                                              : deal.data_conferencia
                                              ? format(new Date(deal.data_conferencia), "dd/MM HH:mm")
                                              : "-"}
                                          </span>
                                        </div>
                                      </div>
                                      {etapa.id === "aguardando" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateMutation.mutate({
                                              id: deal.id,
                                              data: {
                                                status_aprovacao: "analisando",
                                                analisado_por: userEmail,
                                                data_analise: new Date().toISOString(),
                                              }
                                            });
                                          }}
                                          className="w-full mt-1 py-1.5 text-xs font-semibold rounded-lg bg-[#EFC200]/10 hover:bg-[#EFC200]/20 text-[#D4A900] border border-[#EFC200]/30 hover:border-[#EFC200]/60 transition-all flex items-center justify-center gap-1.5"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          Analisar
                                        </button>
                                      )}
                                      {deal.status_aprovacao !== "aprovado" && (deal.motivos_reprova?.length > 0 || deal.motivo_reprova_categoria) && (
                                        <div className="text-xs text-red-600 pt-2 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-2 mt-2 rounded-b space-y-1">
                                          {deal.motivos_reprova && deal.motivos_reprova.length > 0 ? (
                                            deal.motivos_reprova.map((motivo, idx) => (
                                              <div key={idx}>
                                                <strong>{categoriesMotivo[motivo.categoria]}:</strong> {motivo.detalhe}
                                              </div>
                                            ))
                                          ) : deal.motivo_reprova_categoria ? (
                                            <div>
                                              <strong>{categoriesMotivo[deal.motivo_reprova_categoria]}:</strong> {deal.motivo_reprova_detalhe}
                                            </div>
                                          ) : null}
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Motivos da Reprova</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMotivosReprova([{ categoria: "", detalhe: "" }, ...motivosReprova])}
                    className="h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Motivo
                  </Button>
                </div>

                {motivosReprova.map((motivo, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs font-semibold mb-1.5 block">Categoria *</Label>
                          <Select 
                            value={motivo.categoria} 
                            onValueChange={(value) => {
                              const novosMotivos = [...motivosReprova];
                              novosMotivos[index].categoria = value;
                              setMotivosReprova(novosMotivos);
                            }}
                          >
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
                          <Label className="text-xs font-semibold mb-1.5 block">Especificar Detalhe *</Label>
                          <Textarea
                            value={motivo.detalhe}
                            onChange={(e) => {
                              const novosMotivos = [...motivosReprova];
                              novosMotivos[index].detalhe = e.target.value;
                              setMotivosReprova(novosMotivos);
                            }}
                            placeholder="Descreva o motivo específico..."
                            rows={3}
                          />
                        </div>
                      </div>

                      {motivosReprova.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const novosMotivos = motivosReprova.filter((_, i) => i !== index);
                            setMotivosReprova(novosMotivos);
                          }}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setMotivosReprova([{ categoria: "", detalhe: "" }]);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReprovar}
                  variant="destructive"
                  className="flex-1"
                  disabled={motivosReprova.filter(m => m.categoria && m.detalhe).length === 0}
                >
                  Reprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes da Negociação */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-white to-slate-50">
          {/* Header premium */}
          {selectedDeal && (
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-1 h-7 bg-[#EFC200] rounded-full flex-shrink-0" />
                    <h2 className="text-xl font-bold text-slate-900 truncate">
                      {selectedDeal.modelo_veiculo || selectedDeal.nome_cliente}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 pl-4">{selectedDeal.nome_cliente}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedDeal.placa && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const placaSemHifen = selectedDeal.placa.replace(/-/g, '');
                        navigator.clipboard.writeText(placaSemHifen);
                        // Visual feedback
                        const btn = e.currentTarget;
                        const originalText = btn.querySelector('span').textContent;
                        btn.querySelector('span').textContent = 'Copiado!';
                        setTimeout(() => {
                          if (btn.querySelector('span')) {
                            btn.querySelector('span').textContent = originalText;
                          }
                        }, 1500);
                      }}
                      className="bg-[#EFC200]/10 border border-[#EFC200]/40 rounded-lg px-3 py-1.5 flex items-center gap-1.5 hover:bg-[#EFC200]/20 transition-colors cursor-pointer"
                    >
                      <Car className="w-3.5 h-3.5 text-[#EFC200]" />
                      <span className="text-sm font-bold text-slate-800 tracking-wider">{selectedDeal.placa}</span>
                    </button>
                  )}
                  <button onClick={() => setShowDetails(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedDeal && (
            <div className="px-6 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-90px)]">

              {/* Cards de destaque */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Plano</p>
                  <p className="text-sm font-bold text-slate-900 capitalize">{selectedDeal.plano_interesse?.replace("_", " ") || "-"}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Mensalidade</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDeal.valor_mensalidade || "-"}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vencimento</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDeal.data_vencimento ? `Dia ${selectedDeal.data_vencimento}` : "-"}</p>
                </div>
              </div>

              {/* Badges: Origem + Desconto + Benefício */}
              <div className="flex flex-wrap gap-2">
                {selectedDeal.origem && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {selectedDeal.origem === "lead" ? (
                      selectedDeal.origem.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                    ) : (
                      <Select
                        value={selectedDeal.origem}
                        onValueChange={(value) => {
                          updateMutation.mutate({
                            id: selectedDeal.id,
                            data: { origem: value }
                          });
                        }}
                      >
                        <SelectTrigger className="h-5 border-0 bg-transparent p-0 text-xs font-semibold focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indicacao">Indicação</SelectItem>
                          <SelectItem value="organico">Orgânico</SelectItem>
                          <SelectItem value="troca_titularidade">Troca de Titularidade</SelectItem>
                          <SelectItem value="troca_veiculo">Troca de Veículo</SelectItem>
                          <SelectItem value="segundo_veiculo">Segundo Veículo</SelectItem>
                          <SelectItem value="migracao">Migração</SelectItem>
                          <SelectItem value="lead_pre_sistema">Lead Pré-Sistema</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${selectedDeal.desconto === "sim" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedDeal.desconto === "sim" ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {selectedDeal.desconto === "sim" ? `Desconto ${selectedDeal.desconto_opcao || ""}` : "Sem Desconto"}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${selectedDeal.beneficio_adicional === "sim" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedDeal.beneficio_adicional === "sim" ? "bg-amber-400" : "bg-slate-300"}`} />
                  {selectedDeal.beneficio_adicional === "sim" ? (selectedDeal.beneficio_adicional_opcao || "Benefício Adicional") : "Sem Benefício"}
                </span>
                {selectedDeal.origem === "troca_veiculo" && selectedDeal.placa_veiculo_antigo && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFC200]/10 text-slate-700 text-xs font-semibold border border-[#EFC200]/30">
                    <Car className="w-3 h-3 text-[#EFC200]" />
                    Ant. {selectedDeal.placa_veiculo_antigo}
                  </span>
                )}
              </div>

              {/* Info do cliente */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Telefone</p>
                    <p className="text-sm text-slate-900">{selectedDeal.telefone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">E-mail</p>
                    <p className="text-sm text-slate-900 break-all">{selectedDeal.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Adesão</p>
                    <p className="text-sm text-slate-900">{selectedDeal.valor_adesao || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Entrada</p>
                    <p className="text-sm text-slate-900">{selectedDeal.data_entrada ? format(new Date(selectedDeal.data_entrada), "dd/MM/yyyy") : "-"}</p>
                  </div>
                </div>
                {selectedDeal.observacoes && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Observações</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedDeal.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Análise e Aprovação */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Análise e Aprovação</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedDeal.data_conferencia && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Conferido em</p>
                      <p className="text-xs text-slate-700">{format(new Date(selectedDeal.data_conferencia), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  )}
                  {selectedDeal.data_analise && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Analisado em</p>
                      <p className="text-xs text-slate-700">{format(new Date(selectedDeal.data_analise), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">Alterar Status</Label>
                    <Select
                      value={selectedDeal.status_aprovacao || "aguardando"}
                      onValueChange={(newStatus) => {
                        if (newStatus === "reprovado") {
                          setShowDetails(false);
                          setSelectedDeal(selectedDeal);
                          setShowModal(true);
                        } else if (newStatus === "corrigido") {
                          updateMutation.mutate({
                            id: selectedDeal.id,
                            data: {
                              status_aprovacao: "corrigido",
                              etapa: "enviado_cadastro",
                              informacoes_conferidas: false,
                            }
                          });
                        } else if (newStatus === "aprovado") {
                          updateMutation.mutate({
                            id: selectedDeal.id,
                            data: {
                              status_aprovacao: "aprovado",
                              etapa: "venda_ativa",
                              aprovado_por: userEmail,
                              data_aprovacao: new Date().toISOString(),
                              data_venda_ativa: new Date().toISOString(),
                            }
                          });
                        } else if (newStatus === "analisando") {
                          updateMutation.mutate({
                            id: selectedDeal.id,
                            data: {
                              status_aprovacao: "analisando",
                              analisado_por: userEmail,
                              data_analise: new Date().toISOString(),
                            }
                          });
                        } else {
                          updateMutation.mutate({
                            id: selectedDeal.id,
                            data: { status_aprovacao: newStatus }
                          });
                        }
                        setShowDetails(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="aguardando">Aguardando Análise</SelectItem>
                      <SelectItem value="analisando">Analisando</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                      <SelectItem value="corrigido">Corrigidos</SelectItem>
                      <SelectItem value="aguardando_termo">Aguardando Termo de Danos</SelectItem>
                      <SelectItem value="aprovado">Aprovados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Consultor</p>
                    <p className="text-sm font-medium text-slate-900">{getNomeVendedor(selectedDeal.vendedor_email) || "-"}</p>
                  </div>
                </div>
                {(selectedDeal.analisado_por || selectedDeal.data_analise || selectedDeal.aprovado_por || selectedDeal.data_aprovacao) && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    {selectedDeal.analisado_por && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Analisado Por</p>
                        <p className="text-xs text-slate-700">{selectedDeal.analisado_por}</p>
                      </div>
                    )}
                    {selectedDeal.data_analise && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data da Análise</p>
                        <p className="text-xs text-slate-700">{format(new Date(selectedDeal.data_analise), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    )}
                    {selectedDeal.aprovado_por && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Aprovado Por</p>
                        <p className="text-xs text-slate-700">{selectedDeal.aprovado_por}</p>
                      </div>
                    )}
                    {selectedDeal.data_aprovacao && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Data de Aprovação</p>
                        <p className="text-xs text-slate-700">{format(new Date(selectedDeal.data_aprovacao), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Anexos de Reprova */}
              {(() => {
                const anexos = selectedDeal?.anexos_reprova || [];
                if (anexos.length === 0) return null;
                return (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Arquivos do Vendedor</h3>
                    <AnexosReprova
                      negociacao={selectedDeal}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ["negociacoes"] })}
                      readOnly={true}
                    />
                  </div>
                );
              })()}

              {/* Checklist */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Checklist do Consultor</h3>
                <div className="space-y-2">
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
                      <div key={item.key} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isChecked ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                        <Checkbox checked={isChecked} disabled className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                        <IconComponent className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? "text-green-600" : "text-slate-400"}`} />
                        <span className={`text-xs flex-1 font-medium ${isChecked ? "text-green-700" : "text-slate-600"}`}>{item.label}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pendência Corrigida */}
              {selectedDeal.status_aprovacao === "corrigido" && historicoReprov.length > 0 && historicoReprov[0] && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Pendência Corrigida
                  </h3>
                  <div className="space-y-2">
                    {historicoReprov[0].motivos?.map((motivo, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-2.5 flex items-start gap-2 border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-green-700">{categoriesMotivo[motivo.categoria]}</p>
                          <p className="text-xs text-green-600 mt-0.5">{motivo.detalhe}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de Reprovas */}
              {historicoReprov.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowHistorico(!showHistorico)}
                    className="w-full flex items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Histórico de Reprovas</span>
                    </div>
                    {showHistorico ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showHistorico && (
                    <div className="px-4 pb-4 space-y-3 max-h-80 overflow-y-auto border-t border-slate-100">
                      {historicoReprov.slice(1).map((sessao, sessaoIndex) => (
                        <div key={`${sessao.data_analise}-${sessaoIndex}`} className="pt-3">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            {format(new Date(sessao.data_analise), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          <div className="space-y-1.5">
                            {sessao.motivos?.map((motivo, idx) => (
                              <div key={idx} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                <p className="text-xs font-semibold text-slate-700">{categoriesMotivo[motivo.categoria]}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{motivo.detalhe}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pb-4" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}