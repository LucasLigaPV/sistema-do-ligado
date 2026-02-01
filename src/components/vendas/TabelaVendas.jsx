import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  UserPlus,
  PartyPopper,
  DollarSign,
  Camera,
  Loader,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import FormularioVenda from "./FormularioVenda";
import FormularioIndicacaoVenda from "./FormularioIndicacaoVenda";

const etapaConfig = {
  pagamento_ok: { label: "Pagamento OK", color: "bg-amber-100 text-amber-800 border border-amber-300", icon: DollarSign },
  vistoria_ok: { label: "Vistoria OK", color: "bg-blue-100 text-blue-800 border border-blue-300", icon: Camera },
  em_ativacao: { label: "Em Ativação", color: "bg-purple-100 text-purple-800 border border-purple-300", icon: Loader },
  ativo: { label: "Ativo", color: "bg-emerald-100 text-emerald-800 border border-emerald-300", icon: CheckCircle2 },
};

const planoLabels = {
  essencial: "Essencial",
  principal: "Principal",
};

const canalLabels = {
  lead: "Lead",
  indicacao: "Indicação",
  troca_veiculo: "Troca de Veículo",
};

const formatarValorExibicao = (valor) => {
  if (!valor) return "-";
  const numero = parseFloat(valor.replace(/[^0-9,]/g, "").replace(",", "."));
  if (isNaN(numero)) return valor;
  
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function TabelaVendas({ userEmail, userRole, userFuncao }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("all");
  const [consultorFilter, setConsultorFilter] = useState(
    userFuncao === "lider" ? [userEmail] : userRole === "admin" ? [] : [userEmail]
  );
  const [dataInicio, setDataInicio] = useState(inicioMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(fimMes.toISOString().split('T')[0]);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showIndicacaoForm, setShowIndicacaoForm] = useState(null);
  const [showAtivoAlert, setShowAtivoAlert] = useState(false);
  const queryClient = useQueryClient();

  const { data: allVendas = [], isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });

  const { data: indicacoes = [] } = useQuery({
    queryKey: ["indicacoes"],
    queryFn: () => base44.entities.Indicacao.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.filter({ ativa: true }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Obter equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail);
  const membrosEquipe = minhaEquipe ? [userEmail, ...(minhaEquipe.membros || [])] : [];

  const vendas = userRole === "admin" 
    ? allVendas 
    : userFuncao === "lider"
    ? allVendas.filter((v) => membrosEquipe.includes(v.vendedor))
    : allVendas.filter(v => v.vendedor === userEmail);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Venda.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["vendas"] });
      const previousVendas = queryClient.getQueryData(["vendas"]);
      queryClient.setQueryData(["vendas"], (old) =>
        old.map((v) => (v.id === id ? { ...v, ...data } : v))
      );
      return { previousVendas };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["vendas"], context.previousVendas);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      const venda = vendas.find(v => v.id === variables.id);
      if (variables.data.etapa === "ativo" && venda?.tem_indicacao === "sim") {
        setShowAtivoAlert(true);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Venda.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendas"] }),
  });

  const filteredVendas = vendas.filter((venda) => {
    const matchSearch =
      venda.cliente?.toLowerCase().includes(search.toLowerCase()) ||
      venda.placa?.toLowerCase().includes(search.toLowerCase()) ||
      venda.telefone?.toLowerCase().includes(search.toLowerCase());
    const matchEtapa = etapaFilter === "all" || venda.etapa === etapaFilter;
    const matchConsultor = userFuncao === "lider" 
      ? consultorFilter.length === 0 || consultorFilter.includes(venda.vendedor)
      : consultorFilter === "all" || venda.vendedor === consultorFilter;
    
    if (dataInicio && venda.data_venda) {
      const dataVenda = new Date(venda.data_venda);
      const inicio = new Date(dataInicio);
      if (dataVenda < inicio) return false;
    }
    if (dataFim && venda.data_venda) {
      const dataVenda = new Date(venda.data_venda);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      if (dataVenda > fim) return false;
    }
    
    return matchSearch && matchEtapa && matchConsultor;
  });

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Etapa",
      "Cliente",
      "Telefone",
      "Plano",
      "Placa",
      "Adesão",
      "Forma Pagamento",
      "Canal",
      "Indicação",
      "Valor Indicação",
    ];
    const rows = filteredVendas.map((v) => [
      v.data_venda ? format(new Date(v.data_venda), "dd/MM/yyyy") : "-",
      v.etapa,
      v.cliente,
      v.telefone,
      v.plano_vendido,
      v.placa,
      v.valor_adesao,
      v.forma_pagamento,
      v.canal_venda,
      v.tem_indicacao,
      v.valor_indicacao || "-",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getStats = () => {
    const total = vendas.length;
    const pagamentoOk = vendas.filter((v) => v.etapa === "pagamento_ok").length;
    const vistoriaOk = vendas.filter((v) => v.etapa === "vistoria_ok").length;
    const emAtivacao = vendas.filter((v) => v.etapa === "em_ativacao").length;
    const ativas = vendas.filter((v) => v.etapa === "ativo").length;
    return { total, pagamentoOk, vistoriaOk, emAtivacao, ativas };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header with Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Registro de Vendas</h2>
          <p className="text-slate-500">Acompanhe e gerencie todas as vendas</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2 bg-[#EFC200] hover:bg-[#D4A900] text-black"
        >
          <Plus className="w-4 h-4" />
          Registrar Nova Venda
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600">Pagamento OK</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pagamentoOk}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">Vistoria OK</p>
            <p className="text-2xl font-bold text-blue-600">{stats.vistoriaOk}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-purple-600">Em Ativação</p>
            <p className="text-2xl font-bold text-purple-600">{stats.emAtivacao}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-600">Ativas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.ativas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Filtros</h3>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${userFuncao === "lider" ? "lg:grid-cols-6" : "lg:grid-cols-5"} gap-4`}>
            <div className="lg:col-span-2">
              <Label className="text-sm text-slate-600 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cliente, placa, telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Etapa</Label>
              <Select value={etapaFilter} onValueChange={setEtapaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pagamento_ok">Pagamento OK</SelectItem>
                  <SelectItem value="vistoria_ok">Vistoria OK</SelectItem>
                  <SelectItem value="em_ativacao">Em Ativação</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {userFuncao === "lider" && (
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Vendedor</Label>
                <div className="space-y-2 p-3 border rounded-md bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="all-sellers"
                      checked={consultorFilter.length === membrosEquipe.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConsultorFilter(membrosEquipe);
                        } else {
                          setConsultorFilter([]);
                        }
                      }}
                    />
                    <Label htmlFor="all-sellers" className="text-sm font-medium cursor-pointer">
                      Todos da Equipe
                    </Label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {membrosEquipe.map((email) => {
                      const user = users.find(u => u.email === email);
                      const isChecked = consultorFilter.includes(email);
                      const isCurrentUser = email === userEmail;
                      return (
                        <div key={email} className="flex items-center gap-2">
                          <Checkbox 
                            id={email}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setConsultorFilter([...consultorFilter, email]);
                              } else {
                                setConsultorFilter(consultorFilter.filter(e => e !== email));
                              }
                            }}
                          />
                          <Label htmlFor={email} className="text-sm cursor-pointer">
                            {user?.full_name || email} {isCurrentUser && "(Você)"}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={exportToCSV} className="gap-2 w-full md:w-auto">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Data</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Adesão</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredVendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendas.map((venda) => {
                    const EtapaIcon = etapaConfig[venda.etapa]?.icon || Clock;
                    return (
                      <motion.tr
                        key={venda.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="text-slate-600">
                          {venda.data_venda ? format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={venda.etapa}
                            onValueChange={(v) => updateMutation.mutate({ id: venda.id, data: { etapa: v } })}
                          >
                            <SelectTrigger className={`w-40 h-9 border-0 ${etapaConfig[venda.etapa]?.color} font-medium`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pagamento_ok">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Pagamento OK
                                </div>
                              </SelectItem>
                              <SelectItem value="vistoria_ok">
                                <div className="flex items-center gap-2">
                                  <Camera className="w-4 h-4" />
                                  Vistoria OK
                                </div>
                              </SelectItem>
                              <SelectItem value="em_ativacao">
                                <div className="flex items-center gap-2">
                                  <Loader className="w-4 h-4" />
                                  Em Ativação
                                </div>
                              </SelectItem>
                              <SelectItem value="ativo">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Ativo
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="font-medium">{venda.cliente}</TableCell>
                        <TableCell>{venda.telefone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{planoLabels[venda.plano_vendido]}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{venda.placa}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          R$ {formatarValorExibicao(venda.valor_adesao)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {venda.tem_indicacao === "sim" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => venda.etapa === "ativo" && setShowIndicacaoForm(venda)}
                                disabled={venda.etapa !== "ativo"}
                                className={venda.etapa === "ativo" ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50" : "text-slate-300 cursor-not-allowed"}
                                title={venda.etapa === "ativo" ? "Preencher indicação" : "Aguardando venda ativa"}
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedVenda(venda)}
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            {userRole === "admin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(venda.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Venda</DialogTitle>
          </DialogHeader>
          <FormularioVenda onSuccess={() => setShowForm(false)} userEmail={userEmail} />
        </DialogContent>
      </Dialog>

      {/* Ativo Alert Dialog */}
      <Dialog open={showAtivoAlert} onOpenChange={setShowAtivoAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <PartyPopper className="w-6 h-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-xl">Parabéns pela venda ativa!</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-slate-600">
              Esta venda é uma <span className="font-semibold text-purple-600">indicação</span>. 
              Clique no ícone de pessoa <UserPlus className="w-4 h-4 inline text-purple-600" /> na venda 
              para preencher os dados da indicação.
            </p>
            <Button
              onClick={() => setShowAtivoAlert(false)}
              className="w-full bg-[#EFC200] hover:bg-[#D4A900] text-black"
            >
              Ok, estou ciente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Indicacao Form Dialog */}
      <Dialog open={!!showIndicacaoForm} onOpenChange={() => setShowIndicacaoForm(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preencher Indicação</DialogTitle>
          </DialogHeader>
          {showIndicacaoForm && (
            <FormularioIndicacaoVenda 
              venda={showIndicacaoForm} 
              onSuccess={() => setShowIndicacaoForm(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedVenda && (() => {
            const indicacaoRelacionada = indicacoes.find(ind => ind.venda_id === selectedVenda.id);
            return (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Data da Venda</p>
                  <p className="font-medium">
                    {selectedVenda.data_venda ? format(new Date(selectedVenda.data_venda), "dd/MM/yyyy") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Etapa</p>
                  <Badge className={etapaConfig[selectedVenda.etapa]?.color}>
                    {etapaConfig[selectedVenda.etapa]?.label}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-slate-800">Dados do Cliente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium">{selectedVenda.cliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Telefone</p>
                    <p className="font-medium">{selectedVenda.telefone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Placa</p>
                    <p className="font-medium font-mono">{selectedVenda.placa}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-slate-800">Informações da Venda</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Plano Vendido</p>
                    <p className="font-medium">{planoLabels[selectedVenda.plano_vendido]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Valor Adesão</p>
                    <p className="font-medium text-emerald-600">R$ {formatarValorExibicao(selectedVenda.valor_adesao)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Forma de Pagamento</p>
                    <p className="font-medium">{selectedVenda.forma_pagamento === "pix" ? "Pix" : "Crédito"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Canal de Venda</p>
                    <p className="font-medium">{canalLabels[selectedVenda.canal_venda]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Possui Indicação</p>
                    <p className="font-medium">{selectedVenda.tem_indicacao === "sim" ? "Sim" : "Não"}</p>
                  </div>
                  {selectedVenda.tem_indicacao === "sim" && (
                    <div>
                      <p className="text-sm text-slate-500">Valor Indicação</p>
                      <p className="font-medium text-purple-600">
                        {indicacaoRelacionada?.valor_indicacao ? `R$ ${indicacaoRelacionada.valor_indicacao}` : "-"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}