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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-[#FFF9E6] text-[#D4A900] border border-[#EFC200]", icon: Clock },
  aprovada: { label: "Aprovada", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  paga: { label: "Paga", color: "bg-emerald-100 text-emerald-800", icon: DollarSign },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function TabelaIndicacoes({ userEmail, userRole }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consultorFilter, setConsultorFilter] = useState("all");
  const [dataInicio, setDataInicio] = useState(inicioMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(fimMes.toISOString().split('T')[0]);
  const [selectedIndicacao, setSelectedIndicacao] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: allIndicacoes = [], isLoading } = useQuery({
    queryKey: ["indicacoes"],
    queryFn: () => base44.entities.Indicacao.list("-created_date"),
  });

  const indicacoes = userRole === "admin" 
    ? allIndicacoes 
    : allIndicacoes.filter(ind => ind.consultor_responsavel === userEmail);

  const { data: configs = [] } = useQuery({
    queryKey: ["configs"],
    queryFn: () => base44.entities.ConfiguracaoFormulario.list(),
  });

  const consultores = configs.find((c) => c.tipo === "consultores")?.opcoes || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Indicacao.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["indicacoes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Indicacao.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["indicacoes"] }),
  });

  const handleFileUpload = async (indicacaoId, file) => {
    setUploadingId(indicacaoId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateMutation.mutateAsync({ id: indicacaoId, data: { comprovante_url: file_url } });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveComprovante = async (indicacaoId) => {
    await updateMutation.mutateAsync({ id: indicacaoId, data: { comprovante_url: null } });
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      window.open(url, '_blank');
    }
  };

  const filteredIndicacoes = indicacoes.filter((ind) => {
    const matchSearch =
      ind.nome_indicado?.toLowerCase().includes(search.toLowerCase()) ||
      ind.nome_indicador?.toLowerCase().includes(search.toLowerCase()) ||
      ind.consultor_responsavel?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || ind.status === statusFilter;
    const matchConsultor =
      consultorFilter === "all" || ind.consultor_responsavel === consultorFilter;
    
    // Filtro de data
    if (dataInicio) {
      const dataInd = new Date(ind.created_date);
      const inicio = new Date(dataInicio);
      if (dataInd < inicio) return false;
    }
    if (dataFim) {
      const dataInd = new Date(ind.created_date);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      if (dataInd > fim) return false;
    }
    
    return matchSearch && matchStatus && matchConsultor;
  });

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Consultor",
      "Nome Indicado",
      "Placa",
      "Nome Indicador",
      "CPF Indicador",
      "Email",
      "Telefone",
      "Relação",
      "Vínculo",
      "Valor",
      "Chave Pix",
      "Tipo Chave",
      "Status",
    ];
    const rows = filteredIndicacoes.map((ind) => [
      format(new Date(ind.created_date), "dd/MM/yyyy HH:mm"),
      ind.consultor_responsavel,
      ind.nome_indicado,
      ind.placa_indicado,
      ind.nome_indicador,
      ind.cpf_indicador,
      ind.email_indicador,
      ind.telefone_indicador,
      ind.relacao_indicador_indicado,
      ind.vinculo_consultor,
      ind.valor_indicacao,
      ind.chave_pix,
      ind.tipo_chave_pix,
      ind.status,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `indicacoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getStats = () => {
    const total = indicacoes.length;
    const pendentes = indicacoes.filter((i) => i.status === "pendente").length;
    const aprovadas = indicacoes.filter((i) => i.status === "aprovada").length;
    const pagas = indicacoes.filter((i) => i.status === "paga").length;
    return { total, pendentes, aprovadas, pagas };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-[#D4A900]">Aprovadas</p>
            <p className="text-2xl font-bold text-[#D4A900]">{stats.aprovadas}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-600">Pagas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.pagas}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Label className="text-sm text-slate-600 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome..."
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
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Consultor</Label>
              <Select value={consultorFilter} onValueChange={setConsultorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {consultores.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
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
                <TableHead>Consultor</TableHead>
                <TableHead>Indicado</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredIndicacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                      Nenhuma indicação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIndicacoes.map((ind) => {
                    const StatusIcon = statusConfig[ind.status]?.icon || Clock;
                    return (
                      <motion.tr
                        key={ind.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="text-slate-600">
                          {format(new Date(ind.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{ind.consultor_responsavel}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ind.nome_indicado}</p>
                            <p className="text-xs text-slate-500">{ind.placa_indicado}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ind.nome_indicador}</p>
                            <p className="text-xs text-slate-500">{ind.telefone_indicador}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          {ind.valor_indicacao}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ind.status}
                            onValueChange={(v) => updateMutation.mutate({ id: ind.id, data: { status: v } })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <Badge className={`${statusConfig[ind.status]?.color} flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[ind.status]?.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="aprovada">Aprovada</SelectItem>
                              <SelectItem value="paga">Paga</SelectItem>
                              <SelectItem value="rejeitada">Rejeitada</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {userRole === "admin" ? (
                            <div className="flex items-center gap-2">
                              {uploadingId === ind.id ? (
                                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              ) : ind.comprovante_url ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDownload(ind.comprovante_url, `comprovante_${ind.id}`)}
                                  >
                                    <Download className="w-4 h-4 text-emerald-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveComprovante(ind.id)}
                                    className="h-8 w-8"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </Button>
                                </>
                              ) : (
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(ind.id, file);
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 h-8"
                                    asChild
                                  >
                                    <span>
                                      <Upload className="w-3 h-3" />
                                      Anexar
                                    </span>
                                  </Button>
                                </label>
                              )}
                            </div>
                          ) : ind.comprovante_url ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(ind.comprovante_url, `comprovante_${ind.id}`)}
                            >
                              <Download className="w-4 h-4 text-emerald-600" />
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedIndicacao(ind)}
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                            {userRole === "admin" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMutation.mutate(ind.id)}
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedIndicacao} onOpenChange={() => setSelectedIndicacao(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Indicação</DialogTitle>
          </DialogHeader>
          {selectedIndicacao && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Consultor Responsável</p>
                  <p className="font-medium">{selectedIndicacao.consultor_responsavel}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Data de Registro</p>
                  <p className="font-medium">
                    {format(new Date(selectedIndicacao.created_date), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-slate-800">Dados do Indicado</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium">{selectedIndicacao.nome_indicado}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Placa</p>
                    <p className="font-medium">{selectedIndicacao.placa_indicado}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-slate-800">Dados do Indicador</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium">{selectedIndicacao.nome_indicador}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">CPF</p>
                    <p className="font-medium">{selectedIndicacao.cpf_indicador}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">E-mail</p>
                    <p className="font-medium">{selectedIndicacao.email_indicador}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Telefone</p>
                    <p className="font-medium">{selectedIndicacao.telefone_indicador}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Relação</p>
                    <p className="font-medium">{selectedIndicacao.relacao_indicador_indicado}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Vínculo com Consultor</p>
                    <p className="font-medium">{selectedIndicacao.vinculo_consultor}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 text-slate-800">Informações Financeiras</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Valor</p>
                    <p className="font-medium text-emerald-600">{selectedIndicacao.valor_indicacao}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Chave Pix</p>
                    <p className="font-medium">{selectedIndicacao.chave_pix}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tipo de Chave</p>
                    <p className="font-medium">{selectedIndicacao.tipo_chave_pix}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Comprovante</p>
                    {selectedIndicacao.comprovante_url ? (
                      <a
                        href={selectedIndicacao.comprovante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Visualizar
                      </a>
                    ) : (
                      <p className="text-slate-400">Não anexado</p>
                    )}
                  </div>
                </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}