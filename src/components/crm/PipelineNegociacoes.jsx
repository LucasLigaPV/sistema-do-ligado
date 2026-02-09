import React, { useState } from "react";
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
import { Plus, Phone, Mail, Car, Filter, X, Sparkles, MessageCircle, Search, Presentation, Calculator, Handshake, FileCheck, Send, CheckCircle, ChevronRight, ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function PipelineNegociacoes({ userEmail, userFuncao }) {
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editedDeal, setEditedDeal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState({ categoria: "", motivo: "", observacao: "" });
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedVendedores, setSelectedVendedores] = useState([]);
  
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negociacao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
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
      "Cliente oculto"
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
    negociacoesVisiveis = negociacoes.filter(n => todosVendedoresEquipe.includes(n.vendedor_email));
  } else if (userFuncao === "vendedor") {
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

    updateMutation.mutate({
      id: dealId,
      data: { etapa: newEtapa }
    });
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
      updateMutation.mutate({
        id: selectedDeal.id,
        data: { etapa: nextEtapa }
      });
      setSelectedDeal({ ...selectedDeal, etapa: nextEtapa });
      setEditedDeal({ ...editedDeal, etapa: nextEtapa });
    }
  };

  const handlePreviousStage = () => {
    if (!selectedDeal) return;
    const currentIndex = etapas.findIndex(e => e.id === selectedDeal.etapa);
    if (currentIndex > 0) {
      const prevEtapa = etapas[currentIndex - 1].id;
      updateMutation.mutate({
        id: selectedDeal.id,
        data: { etapa: prevEtapa }
      });
      setSelectedDeal({ ...selectedDeal, etapa: prevEtapa });
      setEditedDeal({ ...editedDeal, etapa: prevEtapa });
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

  const vendedoresDisponiveis = users.filter(u => todosVendedoresEquipe.includes(u.email));

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
                                     onClick={() => {
                                       setSelectedDeal(deal);
                                       setEditedDeal({ ...deal });
                                       setShowDetails(true);
                                     }}
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
                  required
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={newDeal.telefone}
                  onChange={(e) => setNewDeal({ ...newDeal, telefone: e.target.value })}
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
                  onChange={(e) => setNewDeal({ ...newDeal, placa: e.target.value })}
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
                  onChange={(e) => setNewDeal({ ...newDeal, valor_mensalidade: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <Label>Valor da Adesão</Label>
                <Input
                  value={newDeal.valor_adesao}
                  onChange={(e) => setNewDeal({ ...newDeal, valor_adesao: e.target.value })}
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
          {selectedDeal && editedDeal && (
            <div className="space-y-6 mt-6">
              {/* Navegação de Etapas */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousStage}
                  disabled={etapas.findIndex(e => e.id === selectedDeal.etapa) === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <div className="text-center flex-1">
                  <Badge className="bg-[#EFC200] text-black">
                    {etapas.find(e => e.id === selectedDeal.etapa)?.label}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdvanceStage}
                  disabled={etapas.findIndex(e => e.id === selectedDeal.etapa) === etapas.length - 1}
                >
                  Avançar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Campos Editáveis */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do Cliente</Label>
                  <Input
                    value={editedDeal.nome_cliente}
                    onChange={(e) => setEditedDeal({ ...editedDeal, nome_cliente: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={editedDeal.telefone}
                    onChange={(e) => setEditedDeal({ ...editedDeal, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editedDeal.email || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Placa</Label>
                  <Input
                    value={editedDeal.placa || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, placa: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Modelo do Veículo</Label>
                  <Input
                    value={editedDeal.modelo_veiculo || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, modelo_veiculo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Plano</Label>
                  <Select
                    value={editedDeal.plano_interesse || ""}
                    onValueChange={(value) => setEditedDeal({ ...editedDeal, plano_interesse: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essencial">Essencial</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Origem</Label>
                  <Select
                    value={editedDeal.origem || ""}
                    onValueChange={(value) => setEditedDeal({ ...editedDeal, origem: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="organico">Orgânico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor da Mensalidade</Label>
                  <Input
                    value={editedDeal.valor_mensalidade || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, valor_mensalidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Valor da Adesão</Label>
                  <Input
                    value={editedDeal.valor_adesao || ""}
                    onChange={(e) => setEditedDeal({ ...editedDeal, valor_adesao: e.target.value })}
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
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Button
                  onClick={handleUpdateDeal}
                  className="w-full bg-[#EFC200] hover:bg-[#D4A900] text-black"
                >
                  Salvar Alterações
                </Button>
                
                {canShowSaleButton && (
                  <Button
                    onClick={handleMarkAsSold}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Marcar como Venda
                  </Button>
                )}

                <Button
                  onClick={() => setShowLossModal(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Marcar como Perda
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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