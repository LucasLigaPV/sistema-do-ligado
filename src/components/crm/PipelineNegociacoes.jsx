import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Phone, Mail, Car, Eye, Filter, X, ChevronDown } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function PipelineNegociacoes({ userEmail, userFuncao }) {
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedVendedores, setSelectedVendedores] = useState([]);
  
  const [newDeal, setNewDeal] = useState({
    vendedor_email: userEmail,
    etapa: "novo_lead",
    nome_cliente: "",
    telefone: "",
    email: "",
    modelo_veiculo: "",
    plano_interesse: "",
    origem: "lead",
    observacoes: "",
    data_entrada: format(new Date(), "yyyy-MM-dd"),
    valor_proposta: ""
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
        modelo_veiculo: "",
        plano_interesse: "",
        origem: "lead",
        observacoes: "",
        data_entrada: format(new Date(), "yyyy-MM-dd"),
        valor_proposta: ""
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negociacao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
    },
  });

  const etapas = [
    { id: "novo_lead", label: "Novo Lead", color: "bg-slate-100 border-slate-300" },
    { id: "abordagem", label: "Abordagem", color: "bg-blue-50 border-blue-200" },
    { id: "sondagem", label: "Sondagem", color: "bg-cyan-50 border-cyan-200" },
    { id: "apresentacao", label: "Apresentação", color: "bg-indigo-50 border-indigo-200" },
    { id: "cotacao", label: "Cotação", color: "bg-purple-50 border-purple-200" },
    { id: "em_negociacao", label: "Em Negociação", color: "bg-yellow-50 border-yellow-200" },
    { id: "vistoria_assinatura_pix", label: "Vistoria/Assinatura/Pix", color: "bg-orange-50 border-orange-200" },
    { id: "enviado_cadastro", label: "Enviado para Cadastro", color: "bg-green-50 border-green-200" },
    { id: "venda_ativa", label: "Venda Ativa", color: "bg-emerald-50 border-emerald-200" },
  ];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar e filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Pipeline de Negociações</h3>
          <p className="text-sm text-slate-500">Gerencie suas negociações por etapa</p>
        </div>
        <div className="flex gap-2">
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {(selectedVendedores.length > 0 || startDate || endDate) && (
                  <Badge className="ml-1 bg-[#EFC200] text-black">
                    {selectedVendedores.length > 0 ? selectedVendedores.length : ""}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
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
          
          <Button onClick={() => setShowNewDeal(true)} className="gap-2 bg-[#EFC200] hover:bg-[#D4A900] text-black">
            <Plus className="w-4 h-4" />
            Nova Negociação
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {etapas.map((etapa) => {
              const dealsNaEtapa = negociacoesVisiveis.filter(n => n.etapa === etapa.id);
              
              return (
                <Droppable key={etapa.id} droppableId={etapa.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-72 flex-shrink-0"
                    >
                      <Card className={`${etapa.color} border-2 h-full`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                              {etapa.label}
                            </CardTitle>
                            <Badge variant="secondary" className="bg-white/50">
                              {dealsNaEtapa.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 min-h-[400px]">
                          <AnimatePresence>
                            {dealsNaEtapa.map((deal, index) => (
                              <Draggable
                                key={deal.id}
                                draggableId={deal.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                  >
                                    <Card
                                      className={`bg-white cursor-move hover:shadow-md transition-shadow ${
                                        snapshot.isDragging ? "shadow-lg rotate-2" : ""
                                      }`}
                                      onClick={() => {
                                        setSelectedDeal(deal);
                                        setShowDetails(true);
                                      }}
                                    >
                                      <CardContent className="p-4 space-y-2">
                                        <div className="font-medium text-sm">
                                          {deal.nome_cliente}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <Phone className="w-3 h-3" />
                                          {deal.telefone}
                                        </div>
                                        {deal.modelo_veiculo && (
                                          <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Car className="w-3 h-3" />
                                            {deal.modelo_veiculo}
                                          </div>
                                        )}
                                        {deal.plano_interesse && (
                                          <Badge className="text-xs bg-slate-100">
                                            {deal.plano_interesse === "essencial" ? "Essencial" : "Principal"}
                                          </Badge>
                                        )}
                                        {userFuncao === "lider" && (
                                          <div className="text-xs text-slate-500 pt-1 border-t">
                                            {getNomeVendedor(deal.vendedor_email)}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                          </AnimatePresence>
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
                <Label>Valor da Proposta</Label>
                <Input
                  value={newDeal.valor_proposta}
                  onChange={(e) => setNewDeal({ ...newDeal, valor_proposta: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={newDeal.observacoes}
                onChange={(e) => setNewDeal({ ...newDeal, observacoes: e.target.value })}
                rows={3}
              />
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

      {/* Dialog: Detalhes da Negociação */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Negociação</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Cliente</Label>
                  <p className="font-medium">{selectedDeal.nome_cliente}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Telefone</Label>
                  <p className="font-medium">{selectedDeal.telefone}</p>
                </div>
                {selectedDeal.email && (
                  <div>
                    <Label className="text-xs text-slate-500">Email</Label>
                    <p className="font-medium">{selectedDeal.email}</p>
                  </div>
                )}
                {selectedDeal.modelo_veiculo && (
                  <div>
                    <Label className="text-xs text-slate-500">Modelo do Veículo</Label>
                    <p className="font-medium">{selectedDeal.modelo_veiculo}</p>
                  </div>
                )}
                {selectedDeal.plano_interesse && (
                  <div>
                    <Label className="text-xs text-slate-500">Plano</Label>
                    <p className="font-medium">
                      {selectedDeal.plano_interesse === "essencial" ? "Essencial" : "Principal"}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-slate-500">Origem</Label>
                  <p className="font-medium capitalize">{selectedDeal.origem}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Data de Entrada</Label>
                  <p className="font-medium">
                    {selectedDeal.data_entrada 
                      ? format(new Date(selectedDeal.data_entrada), "dd/MM/yyyy")
                      : format(new Date(selectedDeal.created_date), "dd/MM/yyyy")}
                  </p>
                </div>
                {selectedDeal.valor_proposta && (
                  <div>
                    <Label className="text-xs text-slate-500">Valor da Proposta</Label>
                    <p className="font-medium">{selectedDeal.valor_proposta}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-slate-500">Etapa Atual</Label>
                  <p className="font-medium">
                    {etapas.find(e => e.id === selectedDeal.etapa)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Vendedor Responsável</Label>
                  <p className="font-medium">{getNomeVendedor(selectedDeal.vendedor_email)}</p>
                </div>
              </div>
              {selectedDeal.observacoes && (
                <div>
                  <Label className="text-xs text-slate-500">Observações</Label>
                  <p className="text-sm mt-1 p-3 bg-slate-50 rounded-md whitespace-pre-wrap">
                    {selectedDeal.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}