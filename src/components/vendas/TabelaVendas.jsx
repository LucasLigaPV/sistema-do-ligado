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
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import FormularioVenda from "./FormularioVenda";
import FormularioIndicacaoVenda from "./FormularioIndicacaoVenda";

const planoLabels = {
  essencial: "Essencial",
  principal: "Principal",
  plano_van: "Plano Van",
  plano_moto: "Plano Moto",
  plano_caminhao: "Plano Caminhão",
};

const canalLabels = {
  lead: "Lead",
  indicacao: "Indicação",
  organico: "Orgânico",
  troca_titularidade: "Troca de Titularidade",
  troca_veiculo: "Troca de Veículo",
  segundo_veiculo: "Segundo Veículo",
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

const getNomeVendedor = (email, users, minhaEquipe = []) => {
  const user = users.find(u => u.email && u.email.toLowerCase() === email?.toLowerCase());
  return user?.nome_exibicao || user?.full_name || email;
};

export default function TabelaVendas({ userEmail, userRole, userFuncao }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [search, setSearch] = useState("");
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

  // Obter equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail);
  const membrosEquipe = minhaEquipe ? [userEmail, ...(minhaEquipe.membros || [])] : [];

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      try {
        const usersList = await base44.entities.User.list();
        return usersList;
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
      }
    },
  });

  const users = allUsers;

  const [consultorFilter, setConsultorFilter] = useState(
    userFuncao === "lider" ? membrosEquipe : userRole === "admin" ? [] : [userEmail]
  );
  const [dataInicio, setDataInicio] = useState(inicioMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(fimMes.toISOString().split('T')[0]);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [showIndicacaoForm, setShowIndicacaoForm] = useState(null);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
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
    const matchConsultor = userFuncao === "lider" 
      ? consultorFilter.length === 0 || consultorFilter.includes(venda.vendedor)
      : true;
    
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
    
    return matchSearch && matchConsultor;
  });

  const exportToCSV = () => {
    const headers = [
      "Data",
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Registro de Vendas</h2>
        <p className="text-slate-500">Vendas são criadas automaticamente quando aprovadas no CRM</p>
      </div>

      {/* Stats Panel */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total de Vendas</p>
              <p className="text-4xl font-bold text-slate-900">{filteredVendas.length}</p>
            </div>
            <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Filtros</h3>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${userFuncao === "lider" ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}>
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
            {userFuncao === "lider" && (
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Vendedor</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-9 px-3"
                    >
                      <span className="text-sm text-slate-700 truncate">
                        {consultorFilter.length === 0 
                          ? "Selecione vendedor" 
                          : consultorFilter.length === membrosEquipe.length 
                          ? "Todos da Equipe" 
                          : consultorFilter.map(email => {
                              const user = users.find(u => u.email === email);
                              return user?.nome_exibicao || user?.full_name || email;
                            }).join(", ")}
                      </span>
                      <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-3" align="start">
                    <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-amber-50">
                      <Checkbox 
                        id="all-team"
                        checked={consultorFilter.length === membrosEquipe.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setConsultorFilter(membrosEquipe);
                          } else {
                            setConsultorFilter([]);
                          }
                        }}
                        className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#D4A900]"
                      />
                      <Label htmlFor="all-team" className="text-sm font-medium cursor-pointer">
                        Todos da Equipe
                      </Label>
                    </div>
                    <div className="border-t pt-2 space-y-2 max-h-48 overflow-y-auto">
                      {membrosEquipe.map((email) => {
                         const isChecked = consultorFilter.includes(email);
                         const isCurrentUser = email === userEmail;
                         const nomeVendedor = getNomeVendedor(email, users, membrosEquipe);
                         return (
                           <div key={email} className={`flex items-center gap-2 truncate p-2 rounded-md transition-colors ${isChecked ? 'bg-amber-100' : 'hover:bg-slate-100'}`}>
                             <Checkbox 
                               id={`seller-${email}`}
                               checked={isChecked}
                               onCheckedChange={(checked) => {
                                 if (checked) {
                                   setConsultorFilter([...consultorFilter, email]);
                                 } else {
                                   setConsultorFilter(consultorFilter.filter(e => e !== email));
                                 }
                               }}
                               className={isChecked ? "data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#D4A900]" : ""}
                             />
                             <Label htmlFor={`seller-${email}`} className="text-sm cursor-pointer truncate font-medium">
                               {nomeVendedor} {isCurrentUser && "(Você)"}
                             </Label>
                           </div>
                         );
                       })}
                    </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
                {userFuncao === "lider" && <TableHead>Vendedor</TableHead>}
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
                        {userFuncao === "lider" && (
                          <TableCell className="font-medium">
                            {getNomeVendedor(venda.vendedor, users, membrosEquipe)}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{venda.cliente}</TableCell>
                        <TableCell>{venda.telefone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{planoLabels[venda.plano_vendido] || venda.plano_vendido}</Badge>
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
                                onClick={() => setShowIndicacaoForm(venda)}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                title="Preencher indicação"
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
                            {(userRole === "admin" || userFuncao === "lider" || venda.vendedor === userEmail) && (
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 bg-[#EFC200] rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-black" />
              </div>
              Detalhes da Venda
            </DialogTitle>
          </DialogHeader>
          {selectedVenda && (() => {
            const indicacaoRelacionada = indicacoes.find(ind => ind.venda_id === selectedVenda.id);
            return (
            <div className="space-y-6 mt-6">
              {/* Header com Data e Etapa */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Data da Venda</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedVenda.data_venda ? format(new Date(selectedVenda.data_venda), "dd/MM/yyyy") : "-"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm px-4 py-2 border-slate-300">
                    {selectedVenda.etapa === "pagamento_ok" && "Pagamento OK"}
                    {selectedVenda.etapa === "vistoria_ok" && "Vistoria OK"}
                    {selectedVenda.etapa === "em_ativacao" && "Em Ativação"}
                    {selectedVenda.etapa === "ativo" && "Ativo"}
                  </Badge>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-600 uppercase tracking-wide">Dados do Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Nome Completo</p>
                    <p className="font-semibold text-slate-900">{selectedVenda.cliente}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="font-semibold text-slate-900">{selectedVenda.telefone}</p>
                  </div>
                  {selectedVenda.email && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{selectedVenda.email}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Placa do Veículo</p>
                    <p className="font-mono font-bold text-lg text-slate-900">{selectedVenda.placa}</p>
                  </div>
                  {selectedVenda.modelo_veiculo && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-slate-500">Modelo do Veículo</p>
                      <p className="font-semibold text-slate-900">{selectedVenda.modelo_veiculo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Financeiras */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-600 uppercase tracking-wide">Informações Financeiras</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 mb-1">Valor Adesão</p>
                      <p className="text-2xl font-bold text-slate-900">
                        R$ {formatarValorExibicao(selectedVenda.valor_adesao)}
                      </p>
                    </CardContent>
                  </Card>
                  {selectedVenda.valor_mensalidade && (
                    <Card className="border-slate-200">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 mb-1">Mensalidade</p>
                        <p className="text-2xl font-bold text-slate-900">
                          R$ {formatarValorExibicao(selectedVenda.valor_mensalidade)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 mb-1">Pagamento</p>
                      <p className="text-lg font-bold text-slate-900">
                        {selectedVenda.forma_pagamento === "pix" ? "Pix" : "Crédito"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Informações da Venda */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-slate-600 uppercase tracking-wide">Detalhes da Venda</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Plano Vendido</p>
                    <p className="font-semibold text-slate-900">
                      {planoLabels[selectedVenda.plano_vendido] || selectedVenda.plano_vendido}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Canal de Venda</p>
                    <p className="font-semibold text-slate-900">
                      {canalLabels[selectedVenda.canal_venda] || selectedVenda.canal_venda}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Possui Indicação</p>
                    <p className="font-semibold text-slate-900">
                      {selectedVenda.tem_indicacao === "sim" ? "Sim" : "Não"}
                    </p>
                  </div>
                  {selectedVenda.tem_indicacao === "sim" && indicacaoRelacionada?.valor_indicacao && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Valor Indicação</p>
                      <p className="font-bold text-slate-900 text-lg">
                        R$ {indicacaoRelacionada.valor_indicacao}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Marketing e Publicidade - Apenas para Admin */}
              {userRole === "admin" && (selectedVenda.plataforma || selectedVenda.posicionamento || selectedVenda.ad || selectedVenda.adset || selectedVenda.campanha || selectedVenda.pagina) && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-600 uppercase tracking-wide">Marketing e Publicidade</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                    {selectedVenda.plataforma && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Plataforma</p>
                        <p className="font-semibold text-slate-900">{selectedVenda.plataforma}</p>
                      </div>
                    )}
                    {selectedVenda.posicionamento && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Posicionamento</p>
                        <p className="font-semibold text-slate-900">{selectedVenda.posicionamento}</p>
                      </div>
                    )}
                    {selectedVenda.campanha && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Campanha</p>
                        <p className="font-semibold text-slate-900">{selectedVenda.campanha}</p>
                      </div>
                    )}
                    {selectedVenda.adset && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Conjunto de Anúncios</p>
                        <p className="font-semibold text-slate-900">{selectedVenda.adset}</p>
                      </div>
                    )}
                    {selectedVenda.ad && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Anúncio</p>
                        <p className="font-semibold text-slate-900">{selectedVenda.ad}</p>
                      </div>
                    )}
                    {selectedVenda.pagina && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Página</p>
                        <p className="font-semibold text-slate-900">{selectedVenda.pagina}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedVenda.observacoes && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-slate-600 uppercase tracking-wide">Observações</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-700">{selectedVenda.observacoes}</p>
                  </div>
                </div>
              )}
            </div>
          );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}