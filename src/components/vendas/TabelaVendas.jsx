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
  CheckCircle,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import FormularioVenda from "./FormularioVenda";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-[#FFF9E6] text-[#D4A900] border border-[#EFC200]", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800", icon: TrendingUp },
  concluido: { label: "Concluído", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
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

export default function TabelaVendas({ userEmail, userRole }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dataInicio, setDataInicio] = useState(inicioMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(fimMes.toISOString().split('T')[0]);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: allVendas = [], isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });

  const vendas = userRole === "admin" 
    ? allVendas 
    : allVendas.filter(v => v.vendedor === userEmail);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Venda.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendas"] }),
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
    const matchStatus = statusFilter === "all" || venda.status === statusFilter;
    
    if (dataInicio) {
      const dataVenda = new Date(venda.created_date);
      const inicio = new Date(dataInicio);
      if (dataVenda < inicio) return false;
    }
    if (dataFim) {
      const dataVenda = new Date(venda.created_date);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      if (dataVenda > fim) return false;
    }
    
    return matchSearch && matchStatus;
  });

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Status",
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
      format(new Date(v.created_date), "dd/MM/yyyy HH:mm"),
      v.status,
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
    const pendentes = vendas.filter((v) => v.status === "pendente").length;
    const emAndamento = vendas.filter((v) => v.status === "em_andamento").length;
    const concluidas = vendas.filter((v) => v.status === "concluido").length;
    return { total, pendentes, emAndamento, concluidas };
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-[#EFC200]">Pendentes</p>
            <p className="text-2xl font-bold text-[#EFC200]">{stats.pendentes}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-600">Concluídas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.concluidas}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <Label className="text-sm text-slate-600 mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                <TableHead>Status</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Adesão</TableHead>
                <TableHead>Indicação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredVendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendas.map((venda) => {
                    const StatusIcon = statusConfig[venda.status]?.icon || Clock;
                    return (
                      <motion.tr
                        key={venda.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="text-slate-600">
                          {format(new Date(venda.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={venda.status}
                            onValueChange={(v) => updateMutation.mutate({ id: venda.id, data: { status: v } })}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <Badge className={`${statusConfig[venda.status]?.color} flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[venda.status]?.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
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
                          R$ {venda.valor_adesao}
                        </TableCell>
                        <TableCell>
                          {venda.tem_indicacao === "sim" ? (
                            <Badge className="bg-purple-100 text-purple-800">
                              R$ {venda.valor_indicacao}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedVenda && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Data de Registro</p>
                  <p className="font-medium">
                    {format(new Date(selectedVenda.created_date), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={statusConfig[selectedVenda.status]?.color}>
                    {statusConfig[selectedVenda.status]?.label}
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
                    <p className="font-medium text-emerald-600">R$ {selectedVenda.valor_adesao}</p>
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
                      <p className="font-medium text-purple-600">R$ {selectedVenda.valor_indicacao}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}