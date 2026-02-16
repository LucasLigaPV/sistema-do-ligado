import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Phone, Mail, Car, Filter, X, Sparkles, MessageCircle, Search, Presentation, Calculator, Handshake, FileCheck, Send, CheckCircle, ChevronRight, ChevronLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function PipelineNegociacoes({ userEmail, userFuncao }) {
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editedDeal, setEditedDeal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState({ categoria: "", motivo: "", observacao: "" });
  const [showSubetapaModal, setShowSubetapaModal] = useState(false);
  const [pendingSubetapa, setPendingSubetapa] = useState(null);
  const [selectedSubetapa, setSelectedSubetapa] = useState("");
  const [showConferenciaModal, setShowConferenciaModal] = useState(false);
  const [conferenciaData, setConferenciaData] = useState(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedVendedores, setSelectedVendedores] = useState([]);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState("");
  
  const [newDeal, setNewDeal] = useState({
    vendedor_email: userEmail,
    etapa: "novo_lead",
    nome_cliente: "",
    telefone: "",
    email: "",
    placa: "",
    modelo_veiculo: "",
    plano_interesse: "",
    origem: "lead",
    data_entrada: format(new Date(), "yyyy-MM-dd"),
    valor_mensalidade: "",
    valor_adesao: "",
    plataforma: "",
    posicionamento: "",
    ad: "",
    adset: "",
    campanha: "",
    pagina: ""
  });

  const queryClient = useQueryClient();

  const { data: negociacoes = [], isLoading } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Real-time subscription para Negociacao
  useEffect(() => {
    const unsubscribe = base44.entities.Negociacao.subscribe((event) => {
      queryClient.setQueryData(["negociacoes"], (old) => {
        if (!old) return old;
        
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Negociacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      setShowNewDeal(false);
      setNewDeal({
        vendedor_email: userEmail,
        etapa: "novo_lead",
        nome_cliente: "",
        telefone: "",
        email: "",
        placa: "",
        modelo_veiculo: "",
        plano_interesse: "",
        origem: "lead",
        data_entrada: format(new Date(), "yyyy-MM-dd"),
        valor_mensalidade: "",
        valor_adesao: "",
        plataforma: "",
        posicionamento: "",
        ad: "",
        adset: "",
        campanha: "",
        pagina: ""
      });
    },
  });

  const createVendaMutation = useMutation({
    mutationFn: (data) => base44.entities.Venda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negociacao.update(id, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      
      // Se a negociação foi movida para venda_ativa, criar registro na entidade Venda
      if (data.etapa === "venda_ativa") {
        const negociacao = negociacoes.find(n => n.id === id);
        if (negociacao) {
          // Criar venda automaticamente
          createVendaMutation.mutate({
            vendedor: negociacao.vendedor_email,
            data_venda: new Date().toISOString().split('T')[0],
            etapa: "pagamento_ok",
            cliente: negociacao.nome_cliente,
            telefone: negociacao.telefone,
            plano_vendido: negociacao.plano_interesse || "essencial",
            placa: negociacao.placa || "",
            valor_adesao: negociacao.valor_adesao || "",
            forma_pagamento: "pix",
            canal_venda: negociacao.origem === "indicacao" ? "indicacao" : negociacao.origem === "organico" ? "troca_veiculo" : "lead",
            tem_indicacao: negociacao.origem === "indicacao" ? "sim" : "nao",
          });
        }
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Negociacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
    },
  });

  const createLossMutation = useMutation({
    mutationFn: (data) => base44.entities.Perda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perdas"] });
    },
  });

  const etapas = [
    { id: "novo_lead", label: "Novo Lead", icon: Sparkles },
    { id: "abordagem", label: "Abordagem", icon: MessageCircle },
    { id: "sondagem", label: "Sondagem", icon: Search },
    { id: "apresentacao", label: "Apresentação", icon: Presentation },
    { id: "cotacao", label: "Cotação", icon: Calculator },
    { id: "em_negociacao", label: "Em Negociação", icon: Handshake },
    { id: "vistoria_assinatura_pix", label: "Vistoria/Assinatura/Pix", icon: FileCheck },
    { id: "enviado_cadastro", label: "Enviado para Cadastro", icon: Send },
    { id: "reprovado", label: "Reprovado", icon: XCircle },
    { id: "venda_ativa", label: "Venda Ativa", icon: CheckCircle },
  ];

  const motivosPerda = {
    financeiro: [
      "Considerou caro",
      "Sem dinheiro no momento",
      "Quer sem valor de entrada",
      "Comprometeu renda na compra do veículo"
    ],
    timing: [
      "Vai analisar",
      "Ainda não possui o veículo",
      "Sem tempo agora",
      "Vai contratar em data futura",
      "Documentação em ajuste",
      "Veículo no mecânico"
    ],
    confianca: [
      "Inseguro com a LIGA",
      "Inseguro com a COBERTURA",
      "Inseguro com o ATENDIMENTO"
    ],
    concorrencia: [
      "Já possui seguro/proteção",
      "Cotando com outras empresas",
      "Perdi para seguradora",
      "Perdi para proteção veicular",
      "Perdi para rastreamento"
    ],
    necessidade: [
      "Deseja somente roubo/furto",
      "Veículo antigo, não vê necessidade",
      "Veículo roda pouco, não vê necessidade"
    ],
    situacoes_esporadicas: [
      "Vendeu o veículo",
      "Não consegui contato",
      "Não solicitou cotação",
      "Bloqueado",
      "Cliente oculto",
      "Erro na Criação da Indicação"
    ],
    lead_invalido: [
      "Veículo sem cobertura",
      "Número Incompleto"
    ]
  };

  // Identificar equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail && e.ativa);
  const membrosEquipe = minhaEquipe ? minhaEquipe.membros : [];
  const todosVendedoresEquipe = minhaEquipe ? [minhaEquipe.lider_email, ...membrosEquipe] : [userEmail];

  // Filtrar negociações por acesso
  let negociacoesVisiveis = negociacoes;
  if (userFuncao === "lider") {
    // Líder vê todas as negociações da sua equipe
    negociacoesVisiveis = negociacoes.filter(n => todosVendedoresEquipe.includes(n.vendedor_email));
  } else {
    // Vendedor vê apenas suas próprias negociações
    negociacoesVisiveis = negociacoes.filter(n => n.vendedor_email === userEmail);
  }

  // Aplicar filtros de data
  negociacoesVisiveis = negociacoesVisiveis.filter((neg) => {
    const negDate = neg.data_entrada ? new Date(neg.data_entrada) : new Date(neg.created_date);
    const matchDate = (!startDate || negDate >= new Date(startDate)) && 
                      (!endDate || negDate <= new Date(endDate + "T23:59:59"));
    return matchDate;
  });

  // Aplicar filtro de vendedores (apenas para líderes)
  if (userFuncao === "lider" && selectedVendedores.length > 0) {
    negociacoesVisiveis = negociacoesVisiveis.filter(n => selectedVendedores.includes(n.vendedor_email));
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newEtapa = result.destination.droppableId;
    const deal = negociacoes.find(n => n.id === dealId);

    // Bloquear movimento de vendedores para "venda_ativa"
    if (newEtapa === "venda_ativa" && (userFuncao === "vendedor" || userFuncao === "lider")) {
      alert("Apenas a área de aprovações pode mover vendas para Venda Ativa!");
      return;
    }

    // Bloquear movimento se informações já foram conferidas
    if (deal?.informacoes_conferidas && deal?.etapa === "enviado_cadastro") {
      alert("Esta venda já foi conferida e está aguardando aprovação. Não pode ser movida.");
      return;
    }

    // Se for movido para "enviado_cadastro", abrir modal de conferência
    if (newEtapa === "enviado_cadastro") {
      setConferenciaData({
        id: dealId,
        etapa: newEtapa,
        ...deal
      });
      setShowConferenciaModal(true);
    } else if (newEtapa === "vistoria_assinatura_pix") {
      // Se for movido para vistoria/assinatura/pix, abrir modal de subetapa
      setPendingSubetapa({ id: dealId, etapa: newEtapa, currentSubetapa: deal?.subetapa });
      setSelectedSubetapa(deal?.subetapa || "");
      setShowSubetapaModal(true);
    } else {
      // Atualização otimista para feedback imediato
      queryClient.setQueryData(["negociacoes"], (old) => {
        return old.map(n => n.id === dealId ? { ...n, etapa: newEtapa, subetapa: "" } : n);
      });
      
      updateMutation.mutate({
        id: dealId,
        data: { etapa: newEtapa, subetapa: "" }
      });
    }
  };

  const handleConfirmSubetapa = () => {
    if (!selectedSubetapa) {
      alert("Por favor, selecione uma subetapa");
      return;
    }

    updateMutation.mutate({
      id: pendingSubetapa.id,
      data: { etapa: pendingSubetapa.etapa, subetapa: selectedSubetapa }
    });

    setShowSubetapaModal(false);
    setPendingSubetapa(null);
    setSelectedSubetapa("");
  };

  const handleConferirInformacoes = () => {
    if (!conferenciaData) return;

    updateMutation.mutate({
      id: conferenciaData.id,
      data: {
        ...conferenciaData,
        etapa: "enviado_cadastro",
        informacoes_conferidas: true,
        data_conferencia: new Date().toISOString(),
        status_aprovacao: "aguardando"
      }
    });

    setShowConferenciaModal(false);
    setConferenciaData(null);
  };

  const handleReprovaCorrigida = () => {
    if (!selectedDeal) return;

    updateMutation.mutate({
      id: selectedDeal.id,
      data: {
        etapa: "enviado_cadastro",
        informacoes_conferidas: true,
        data_conferencia: new Date().toISOString(),
        status_aprovacao: "aguardando"
      }
    });

    setShowDetails(false);
    setSelectedDeal(null);
    setEditedDeal(null);
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    createMutation.mutate(newDeal);
  };

  const handleUpdateDeal = () => {
    if (!editedDeal || !selectedDeal) return;
    updateMutation.mutate({
      id: selectedDeal.id,
      data: editedDeal
    });
    setShowDetails(false);
    setSelectedDeal(null);
    setEditedDeal(null);
  };

  const handleAdvanceStage = () => {
    if (!selectedDeal) return;
    const currentIndex = etapas.findIndex(e => e.id === selectedDeal.etapa);
    if (currentIndex < etapas.length - 1) {
      const nextEtapa = etapas[currentIndex + 1].id;
      
      // Se for movido para "enviado_cadastro", abrir modal de conferência
      if (nextEtapa === "enviado_cadastro") {
        setConferenciaData({
          id: selectedDeal.id,
          etapa: nextEtapa,
          ...selectedDeal
        });
        setShowConferenciaModal(true);
        setShowDetails(false);
      } else if (nextEtapa === "vistoria_assinatura_pix") {
        // Se for movido para vistoria/assinatura/pix, abrir modal de subetapa
        setPendingSubetapa({ id: selectedDeal.id, etapa: nextEtapa, currentSubetapa: selectedDeal?.subetapa });
        setSelectedSubetapa(selectedDeal?.subetapa || "");
        setShowSubetapaModal(true);
        setShowDetails(false);
      } else {
        updateMutation.mutate({
          id: selectedDeal.id,
          data: { etapa: nextEtapa, subetapa: "" }
        });
        setSelectedDeal({ ...selectedDeal, etapa: nextEtapa });
        setEditedDeal({ ...editedDeal, etapa: nextEtapa });
      }
    }
  };

  const handlePreviousStage = () => {
    if (!selectedDeal) return;
    const currentIndex = etapas.findIndex(e => e.id === selectedDeal.etapa);
    if (currentIndex > 0) {
      const prevEtapa = etapas[currentIndex - 1].id;
      
      // Se for movido para "enviado_cadastro", abrir modal de conferência
      if (prevEtapa === "enviado_cadastro") {
        setConferenciaData({
          id: selectedDeal.id,
          etapa: prevEtapa,
          ...selectedDeal
        });
        setShowConferenciaModal(true);
        setShowDetails(false);
      } else if (prevEtapa === "vistoria_assinatura_pix") {
        // Se for movido para vistoria/assinatura/pix, abrir modal de subetapa
        setPendingSubetapa({ id: selectedDeal.id, etapa: prevEtapa, currentSubetapa: selectedDeal?.subetapa });
        setSelectedSubetapa(selectedDeal?.subetapa || "");
        setShowSubetapaModal(true);
        setShowDetails(false);
      } else {
        updateMutation.mutate({
          id: selectedDeal.id,
          data: { etapa: prevEtapa, subetapa: "" }
        });
        setSelectedDeal({ ...selectedDeal, etapa: prevEtapa });
        setEditedDeal({ ...editedDeal, etapa: prevEtapa });
      }
    }
  };

  const handleMarkAsSold = () => {
    if (!selectedDeal) return;
    updateMutation.mutate({
      id: selectedDeal.id,
      data: { etapa: "venda_ativa" }
    });
    setShowDetails(false);
    setSelectedDeal(null);
    setEditedDeal(null);
  };

  const handleMarkAsLoss = () => {
    if (!lossReason.categoria || !lossReason.motivo) {
      alert("Por favor, selecione a categoria e o motivo da perda");
      return;
    }

    const lossData = {
      negociacao_id: selectedDeal.id,
      vendedor_email: selectedDeal.vendedor_email,
      nome_cliente: selectedDeal.nome_cliente,
      telefone: selectedDeal.telefone,
      email: selectedDeal.email || "",
      placa: selectedDeal.placa || "",
      modelo_veiculo: selectedDeal.modelo_veiculo || "",
      plano_interesse: selectedDeal.plano_interesse || "",
      categoria_motivo: lossReason.categoria,
      motivo_perda: lossReason.motivo,
      observacao_perda: lossReason.observacao || "",
      data_perda: format(new Date(), "yyyy-MM-dd"),
      etapa_perda: selectedDeal.etapa,
      valor_adesao: selectedDeal.valor_adesao || "",
      valor_mensalidade: selectedDeal.valor_mensalidade || "",
      origem: selectedDeal.origem || "",
      plataforma: selectedDeal.plataforma || "",
      campanha: selectedDeal.campanha || "",
      data_entrada: selectedDeal.data_entrada || format(new Date(selectedDeal.created_date), "yyyy-MM-dd")
    };

    createLossMutation.mutate(lossData, {
      onSuccess: () => {
        deleteMutation.mutate(selectedDeal.id);
        setShowLossModal(false);
        setShowDetails(false);
        setSelectedDeal(null);
        setEditedDeal(null);
        setLossReason({ categoria: "", motivo: "", observacao: "" });
      }
    });
  };

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const vendedoresDisponiveis = todosVendedoresEquipe
    .map(email => users.find(u => u.email === email))
    .filter(u => u !== undefined);

  const toggleVendedor = (email) => {
    setSelectedVendedores(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const canShowSaleButton = selectedDeal && (
    selectedDeal.etapa === "vistoria_assinatura_pix" ||
    selectedDeal.etapa === "enviado_cadastro"
  );

  const isEtapaFinal = (etapa) => {
    return ["enviado_cadastro", "reprovado", "venda_ativa"].includes(etapa);
  };

  const canAccessDeal = (deal) => {
    // Ninguém pode editar etapas finais (apenas visualizar)
    return true;
  };

  const handleCardClick = (deal) => {
    setSelectedDeal(deal);
    setEditedDeal({ ...deal });
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Barra lateral fixa com botões */}
      <div className="flex-shrink-0 w-16 flex flex-col gap-3 sticky top-4 self-start">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-16 w-16 flex-col gap-1 p-2 relative" size="sm">
              <Filter className="w-5 h-5" />
              <span className="text-[10px]">Filtros</span>
              {(selectedVendedores.length > 0 || startDate || endDate) && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#EFC200] text-black text-xs">
                  {selectedVendedores.length > 0 ? selectedVendedores.length : "•"}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
            <PopoverContent className="w-80" align="start" side="right">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filtros</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {userFuncao === "lider" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Vendedores da Equipe</Label>
                    <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2">
                      {vendedoresDisponiveis.map((vendedor) => (
                        <div key={vendedor.email} className="flex items-center gap-2">
                          <Checkbox
                            id={vendedor.email}
                            checked={selectedVendedores.includes(vendedor.email)}
                            onCheckedChange={() => toggleVendedor(vendedor.email)}
                            className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
                          />
                          <label
                            htmlFor={vendedor.email}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {vendedor.full_name || vendedor.email}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedVendedores.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVendedores([])}
                        className="w-full text-xs"
                      >
                        Limpar Seleção
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        
        <Button 
          onClick={() => setShowNewDeal(true)} 
          className="h-16 w-16 flex-col gap-1 p-2 bg-[#EFC200] hover:bg-[#D4A900] text-black" 
          size="sm"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] leading-tight text-center">Nova</span>
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-w-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max pb-2">
            {etapas.map((etapa) => {
              const dealsNaEtapa = negociacoesVisiveis.filter(n => n.etapa === etapa.id);
              const IconComponent = etapa.icon;
              
              return (
                <Droppable key={etapa.id} droppableId={etapa.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-72 sm:w-80 lg:w-96 flex-shrink-0"
                    >
                      <Card className="bg-white shadow-sm flex flex-col border" style={{ height: 'calc(100vh - 120px)' }}>
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
                              <Draggable
                                key={deal.id}
                                draggableId={deal.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                 <div
                                   ref={provided.innerRef}
                                   {...provided.draggableProps}
                                   {...provided.dragHandleProps}
                                 >
                                   <Card
                                     className={`bg-white cursor-move hover:shadow-md transition-shadow ${
                                       snapshot.isDragging ? "shadow-lg rotate-2" : ""
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
                                        {deal.subetapa && deal.etapa === "vistoria_assinatura_pix" && (
                                          <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                            {deal.subetapa === "aguardando_vistoria" && "Aguardando Vistoria"}
                                            {deal.subetapa === "aguardando_assinatura" && "Aguardando Assinatura"}
                                            {deal.subetapa === "aguardando_pix" && "Aguardando Pix"}
                                          </Badge>
                                        )}
                                        {deal.valor_adesao && (
                                          <div className="text-sm font-medium text-slate-700">
                                            {deal.valor_adesao}
                                          </div>
                                        )}
                                        <div className="text-xs text-slate-500">
                                          {deal.data_entrada 
                                            ? format(new Date(deal.data_entrada), "dd/MM/yyyy")
                                            : format(new Date(deal.created_date), "dd/MM/yyyy")}
                                        </div>
                                        {deal.etapa === "reprovado" && deal.motivo_negacao && (
                                          <div className="text-xs text-red-600 pt-2 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-2 mt-2 rounded-b">
                                            <strong>Motivo:</strong> {deal.motivo_negacao}
                                          </div>
                                        )}
                                        {userFuncao === "lider" && (
                                          <div className="text-xs text-slate-500 pt-1 border-t">
                                            {getNomeVendedor(deal.vendedor_email)}
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
      </div>

      {/* Dialog: Nova Negociação */}
      <Dialog open={showNewDeal} onOpenChange={setShowNewDeal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Negociação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDeal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente *</Label>
                <Input
                  value={newDeal.nome_cliente}
                  onChange={(e) => setNewDeal({ ...newDeal, nome_cliente: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={newDeal.telefone}
                  onChange={(e) => {
                    const numeros = e.target.value.replace(/\D/g, '');
                    let formatado = numeros;
                    if (numeros.length <= 11) {
                      if (numeros.length > 2) {
                        formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                      }
                      if (numeros.length > 7) {
                        formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                      }
                      setNewDeal({ ...newDeal, telefone: formatado });
                    }
                  }}
                  placeholder="(11) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newDeal.email}
                  onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Placa</Label>
                <Input
                  value={newDeal.placa}
                  onChange={(e) => {
                    const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    let formatado = valor;
                    if (valor.length > 3) {
                      formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                    }
                    setNewDeal({ ...newDeal, placa: formatado });
                  }}
                  placeholder="ABC-1D23"
                  maxLength={8}
                />
              </div>
              <div>
                <Label>Modelo do Veículo</Label>
                <Input
                  value={newDeal.modelo_veiculo}
                  onChange={(e) => setNewDeal({ ...newDeal, modelo_veiculo: e.target.value })}
                />
              </div>
              <div>
                <Label>Plano de Interesse</Label>
                <Select
                  value={newDeal.plano_interesse}
                  onValueChange={(value) => setNewDeal({ ...newDeal, plano_interesse: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essencial">Essencial</SelectItem>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="plano_van">Plano Van</SelectItem>
                    <SelectItem value="plano_moto">Plano Moto</SelectItem>
                    <SelectItem value="plano_caminhao">Plano Caminhão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origem</Label>
                <Select
                  value={newDeal.origem}
                  onValueChange={(value) => setNewDeal({ ...newDeal, origem: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="organico">Orgânico</SelectItem>
                    <SelectItem value="troca_titularidade">Troca de Titularidade</SelectItem>
                    <SelectItem value="troca_veiculo">Troca de Veículo</SelectItem>
                    <SelectItem value="segundo_veiculo">Segundo Veículo</SelectItem>
                    <SelectItem value="migracao">Migração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Entrada</Label>
                <Input
                  type="date"
                  value={newDeal.data_entrada}
                  onChange={(e) => setNewDeal({ ...newDeal, data_entrada: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor da Mensalidade</Label>
                <Input
                  value={newDeal.valor_mensalidade}
                  onChange={(e) => {
                    const numeros = e.target.value.replace(/\D/g, '');
                    const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                    const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    setNewDeal({ ...newDeal, valor_mensalidade: formatado });
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <Label>Valor da Adesão</Label>
                <Input
                  value={newDeal.valor_adesao}
                  onChange={(e) => {
                    const numeros = e.target.value.replace(/\D/g, '');
                    const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                    const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    setNewDeal({ ...newDeal, valor_adesao: formatado });
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              {(userFuncao === "master" || userFuncao === "admin") && (
                <>
                  <div>
                    <Label>Plataforma</Label>
                    <Input
                      value={newDeal.plataforma}
                      onChange={(e) => setNewDeal({ ...newDeal, plataforma: e.target.value })}
                      placeholder="Facebook, Google, etc."
                    />
                  </div>
                  <div>
                    <Label>Posicionamento</Label>
                    <Input
                      value={newDeal.posicionamento}
                      onChange={(e) => setNewDeal({ ...newDeal, posicionamento: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Anúncio (Ad)</Label>
                    <Input
                      value={newDeal.ad}
                      onChange={(e) => setNewDeal({ ...newDeal, ad: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Conjunto de Anúncios (AdSet)</Label>
                    <Input
                      value={newDeal.adset}
                      onChange={(e) => setNewDeal({ ...newDeal, adset: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Campanha</Label>
                    <Input
                      value={newDeal.campanha}
                      onChange={(e) => setNewDeal({ ...newDeal, campanha: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Página de Destino</Label>
                    <Input
                      value={newDeal.pagina}
                      onChange={(e) => setNewDeal({ ...newDeal, pagina: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowNewDeal(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#EFC200] hover:bg-[#D4A900] text-black">
                Criar Negociação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sheet: Detalhes da Negociação */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Negociação</SheetTitle>
          </SheetHeader>
          {selectedDeal && editedDeal && (() => {
            const isReadOnly = isEtapaFinal(selectedDeal.etapa);
            return (
            <div className="space-y-6 mt-6">
              {/* Navegação de Etapas */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePreviousStage}
                  disabled={etapas.findIndex(e => e.id === selectedDeal.etapa) === 0 || isEtapaFinal(selectedDeal.etapa)}
                  className="h-12 px-6"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Anterior
                </Button>
                <div className="text-center flex-1">
                  <Badge className="bg-[#EFC200] text-black text-base py-2 px-4">
                    {etapas.find(e => e.id === selectedDeal.etapa)?.label}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAdvanceStage}
                  disabled={etapas.findIndex(e => e.id === selectedDeal.etapa) === etapas.length - 1 || isEtapaFinal(selectedDeal.etapa)}
                  className="h-12 px-6"
                >
                  Avançar
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Campos Editáveis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Cliente</Label>
                  <Input
                    value={editedDeal.nome_cliente}
                    onChange={(e) => setEditedDeal({ ...editedDeal, nome_cliente: e.target.value })}
                    maxLength={100}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={editedDeal.telefone}
                    onChange={(e) => {
                      const numeros = e.target.value.replace(/\D/g, '');
                      let formatado = numeros;
                      if (numeros.length <= 11) {
                        if (numeros.length > 2) {
                          formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                        }
                        if (numeros.length > 7) {
                          formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                        }
                        setEditedDeal({ ...editedDeal, telefone: formatado });
                      }
                    }}
                    placeholder="(11) 00000-0000"
                    maxLength={15}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editedDeal.email || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, email: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Placa</Label>
                  <Input
                    value={editedDeal.placa || ""}
                    onChange={(e) => {
                      const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      let formatado = valor;
                      if (valor.length > 3) {
                        formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                      }
                      setEditedDeal({ ...editedDeal, placa: formatado });
                    }}
                    placeholder="ABC-1D23"
                    maxLength={8}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Modelo do Veículo</Label>
                  <Input
                    value={editedDeal.modelo_veiculo || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, modelo_veiculo: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select
                    value={editedDeal.plano_interesse || ""}
                    onValueChange={(value) => setEditedDeal({ ...editedDeal, plano_interesse: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger disabled={isReadOnly}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essencial">Essencial</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="plano_van">Plano Van</SelectItem>
                      <SelectItem value="plano_moto">Plano Moto</SelectItem>
                      <SelectItem value="plano_caminhao">Plano Caminhão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Origem</Label>
                  <Select
                    value={editedDeal.origem || ""}
                    onValueChange={(value) => setEditedDeal({ ...editedDeal, origem: value })}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger disabled={isReadOnly}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="organico">Orgânico</SelectItem>
                      <SelectItem value="troca_titularidade">Troca de Titularidade</SelectItem>
                      <SelectItem value="troca_veiculo">Troca de Veículo</SelectItem>
                      <SelectItem value="segundo_veiculo">Segundo Veículo</SelectItem>
                      <SelectItem value="migracao">Migração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor da Mensalidade</Label>
                  <Input
                    value={editedDeal.valor_mensalidade || ""}
                    onChange={(e) => {
                      const numeros = e.target.value.replace(/\D/g, '');
                      const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                      const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      setEditedDeal({ ...editedDeal, valor_mensalidade: formatado });
                    }}
                    placeholder="R$ 0,00"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Valor da Adesão</Label>
                  <Input
                    value={editedDeal.valor_adesao || ""}
                    onChange={(e) => {
                      const numeros = e.target.value.replace(/\D/g, '');
                      const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                      const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      setEditedDeal({ ...editedDeal, valor_adesao: formatado });
                    }}
                    placeholder="R$ 0,00"
                    disabled={isReadOnly}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Consultor Responsável</Label>
                  <Input
                    value={getNomeVendedor(selectedDeal.vendedor_email)}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Email do Consultor</Label>
                  <Input
                    value={selectedDeal.vendedor_email}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
                <div>
                  <Label>Data de Entrada</Label>
                  <Input
                    type="date"
                    value={editedDeal.data_entrada || format(new Date(selectedDeal.created_date), "yyyy-MM-dd")}
                    onChange={(e) => setEditedDeal({ ...editedDeal, data_entrada: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                {selectedDeal.etapa === "vistoria_assinatura_pix" && (
                  <div className="col-span-2">
                    <Label>Status da Subetapa</Label>
                    <Select
                      value={editedDeal.subetapa || ""}
                      onValueChange={(value) => setEditedDeal({ ...editedDeal, subetapa: value })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger disabled={isReadOnly}>
                        <SelectValue placeholder="Selecione o status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aguardando_vistoria">Aguardando Vistoria</SelectItem>
                        <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                        <SelectItem value="aguardando_pix">Aguardando Pix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                </div>

              {/* Botões de Ação */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                {isEtapaFinal(selectedDeal.etapa) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    {selectedDeal.etapa === "enviado_cadastro" && "⚠️ Esta venda está aguardando aprovação do time de aprovações. Visualização apenas."}
                    {selectedDeal.etapa === "reprovado" && (
                      <div>
                        <p className="font-semibold mb-1">❌ Esta venda foi reprovada.</p>
                        {selectedDeal.motivo_negacao && (
                          <p className="text-xs mt-1"><strong>Motivo:</strong> {selectedDeal.motivo_negacao}</p>
                        )}
                      </div>
                    )}
                    {selectedDeal.etapa === "venda_ativa" && "✅ Esta venda já está ativa. A placa está em processo de ativação."}
                  </div>
                )}

                {selectedDeal.etapa === "reprovado" && (
                  <Button
                    onClick={handleReprovaCorrigida}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Reprova Corrigida
                  </Button>
                )}

                {!isEtapaFinal(selectedDeal.etapa) && (
                  <Button
                    onClick={handleUpdateDeal}
                    className="w-full bg-[#EFC200] hover:bg-[#D4A900] text-black"
                  >
                    Salvar Alterações
                  </Button>
                )}

                {canShowSaleButton && userFuncao !== "vendedor" && !isEtapaFinal(selectedDeal.etapa) && (
                  <Button
                    onClick={handleMarkAsSold}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Marcar como Venda
                  </Button>
                )}

                {!isEtapaFinal(selectedDeal.etapa) && (
                  <Button
                    onClick={() => setShowLossModal(true)}
                    variant="destructive"
                    className="w-full"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Marcar como Perda
                  </Button>
                )}
                </div>
                </div>
                );
                })()}
                </SheetContent>
                </Sheet>

      {/* Modal: Conferência de Informações */}
      <Dialog open={showConferenciaModal} onOpenChange={setShowConferenciaModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conferir Informações da Venda</DialogTitle>
          </DialogHeader>
          {conferenciaData && (
            <div className="space-y-6">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 mb-1">ATENÇÃO!</p>
                    <p className="text-sm text-amber-800">
                      Um erro nesta etapa pode comprometer a ativação e status da sua venda. Muita atenção!
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Cliente *</Label>
                  <Input
                    value={conferenciaData.nome_cliente || ""}
                    onChange={(e) => setConferenciaData({ ...conferenciaData, nome_cliente: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input
                    value={conferenciaData.telefone || ""}
                    onChange={(e) => {
                      const numeros = e.target.value.replace(/\D/g, '');
                      let formatado = numeros;
                      if (numeros.length <= 11) {
                        if (numeros.length > 2) {
                          formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                        }
                        if (numeros.length > 7) {
                          formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                        }
                        setConferenciaData({ ...conferenciaData, telefone: formatado });
                      }
                    }}
                    placeholder="(11) 00000-0000"
                    maxLength={15}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={conferenciaData.email || ""}
                    onChange={(e) => setConferenciaData({ ...conferenciaData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Placa</Label>
                  <Input
                    value={conferenciaData.placa || ""}
                    onChange={(e) => {
                      const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      let formatado = valor;
                      if (valor.length > 3) {
                        formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                      }
                      setConferenciaData({ ...conferenciaData, placa: formatado });
                    }}
                    placeholder="ABC-1D23"
                    maxLength={8}
                  />
                </div>
                <div>
                  <Label>Modelo do Veículo</Label>
                  <Input
                    value={conferenciaData.modelo_veiculo || ""}
                    onChange={(e) => setConferenciaData({ ...conferenciaData, modelo_veiculo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Plano</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={conferenciaData.plano_interesse || ""}
                    onChange={(e) => setConferenciaData({ ...conferenciaData, plano_interesse: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    <option value="essencial">Essencial</option>
                    <option value="principal">Principal</option>
                    <option value="plano_van">Plano Van</option>
                    <option value="plano_moto">Plano Moto</option>
                    <option value="plano_caminhao">Plano Caminhão</option>
                  </select>
                </div>
                <div>
                  <Label>Valor da Adesão</Label>
                  <Input
                    value={conferenciaData.valor_adesao || ""}
                    onChange={(e) => {
                      const numeros = e.target.value.replace(/\D/g, '');
                      const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                      const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      setConferenciaData({ ...conferenciaData, valor_adesao: formatado });
                    }}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label>Valor da Mensalidade</Label>
                  <Input
                    value={conferenciaData.valor_mensalidade || ""}
                    onChange={(e) => {
                      const numeros = e.target.value.replace(/\D/g, '');
                      const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                      const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      setConferenciaData({ ...conferenciaData, valor_mensalidade: formatado });
                    }}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={conferenciaData.observacoes || ""}
                    onChange={(e) => setConferenciaData({ ...conferenciaData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleConferirInformacoes}
                  className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                  disabled={!conferenciaData.nome_cliente || !conferenciaData.telefone}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Informações Conferidas
                </Button>
              </div>

              <p className="text-center text-sm text-amber-700 font-medium">
                Um erro nesta etapa pode comprometer a ativação e status da sua venda, muita atenção!
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Subetapa */}
      <Dialog open={showSubetapaModal} onOpenChange={setShowSubetapaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Subetapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Selecione o status atual desta negociação:
            </p>
            <div>
              <Label>Status *</Label>
              <Select
                value={selectedSubetapa}
                onValueChange={setSelectedSubetapa}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando_vistoria">Aguardando Vistoria</SelectItem>
                  <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                  <SelectItem value="aguardando_pix">Aguardando Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSubetapaModal(false);
                  setPendingSubetapa(null);
                  setSelectedSubetapa("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSubetapa}
                className="flex-1 bg-[#EFC200] hover:bg-[#D4A900] text-black"
                disabled={!selectedSubetapa}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Acesso Negado */}
      <Dialog open={showAccessDeniedModal} onOpenChange={setShowAccessDeniedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Acesso Limitado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              {accessDeniedReason}
            </p>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  setShowAccessDeniedModal(false);
                  setShowDetails(false);
                  setSelectedDeal(null);
                  setEditedDeal(null);
                }}
                className="flex-1 bg-[#EFC200] hover:bg-[#D4A900] text-black"
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Motivo da Perda */}
      <Dialog open={showLossModal} onOpenChange={setShowLossModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Perda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria do Motivo *</Label>
              <Select
                value={lossReason.categoria}
                onValueChange={(value) => setLossReason({ ...lossReason, categoria: value, motivo: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="timing">Timing/Momento</SelectItem>
                  <SelectItem value="confianca">Confiança</SelectItem>
                  <SelectItem value="concorrencia">Concorrência</SelectItem>
                  <SelectItem value="necessidade">Necessidade/Produto</SelectItem>
                  <SelectItem value="situacoes_esporadicas">Situações Esporádicas</SelectItem>
                  <SelectItem value="lead_invalido">Lead Inválido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lossReason.categoria && (
              <div>
                <Label>Motivo Específico *</Label>
                <Select
                  value={lossReason.motivo}
                  onValueChange={(value) => setLossReason({ ...lossReason, motivo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosPerda[lossReason.categoria]?.map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Observação Adicional</Label>
              <Textarea
                value={lossReason.observacao}
                onChange={(e) => setLossReason({ ...lossReason, observacao: e.target.value })}
                placeholder="Detalhes adicionais sobre a perda..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLossModal(false);
                  setLossReason({ categoria: "", motivo: "", observacao: "" });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleMarkAsLoss}
                variant="destructive"
                className="flex-1"
                disabled={!lossReason.categoria || !lossReason.motivo}
              >
                Confirmar Perda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}