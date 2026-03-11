import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw, LayoutList, LayoutGrid, Phone, Mail, Car, Calendar, DollarSign, User, Download, Filter, X } from "lucide-react";
import { format } from "date-fns";
import FiltroVendedor from "../shared/FiltroVendedor";
import FiltroOrigem from "../shared/FiltroOrigem";
import FiltroCategoriaPerdas from "../shared/FiltroCategoriaPerdas";
import { useUsuarios } from "../shared/useUsuarios";

const exportarCSV = (perdas, users) => {
  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const categoriasLabels = {
    financeiro: "Financeiro",
    timing: "Timing/Momento",
    confianca: "Confiança",
    concorrencia: "Concorrência",
    necessidade: "Necessidade/Produto",
    situacoes_esporadicas: "Situações Esporádicas",
    lead_invalido: "Lead Inválido"
  };

  const headers = [
    "Data da Perda",
    "Cliente",
    "Telefone",
    "Email",
    "Placa",
    "Modelo",
    "Plano",
    "Categoria",
    "Motivo",
    "Observação",
    "Etapa da Perda",
    "Consultor",
    "Valor Adesão",
    "Valor Mensalidade",
    "Origem",
    "Plataforma",
    "Campanha"
  ];

  const rows = perdas.map(p => [
    format(new Date(p.data_perda), "dd/MM/yyyy"),
    p.nome_cliente || "",
    p.telefone || "",
    p.email || "",
    p.placa || "",
    p.modelo_veiculo || "",
    p.plano_interesse || "",
    categoriasLabels[p.categoria_motivo] || p.categoria_motivo || "",
    p.motivo_perda || "",
    p.observacao_perda || "",
    p.etapa_perda || "",
    getNomeVendedor(p.vendedor_email),
    p.valor_adesao || "",
    p.valor_mensalidade || "",
    p.origem || "",
    p.plataforma || "",
    p.campanha || ""
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `perdas_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Perdas({ userEmail, userFuncao }) {
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerda, setSelectedPerda] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [vendedorFilter, setVendedorFilter] = useState([]);
  const [origemFilter, setOrigemFilter] = useState([]);
  const [categoriaFilter, setCategoriaFilter] = useState([]);
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [filtrosAtivos, setFiltrosAtivos] = useState({
    searchTerm: "",
    vendedorFilter: [],
    origemFilter: [],
    categoriaFilter: []
  });

  const queryClient = useQueryClient();

  const { data: perdas = [], isLoading } = useQuery({
    queryKey: ["perdas"],
    queryFn: () => base44.entities.Perda.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { usuarios: allUsers } = useUsuarios();

  const createNegociacaoMutation = useMutation({
    mutationFn: (data) => base44.entities.Negociacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
    },
  });

  const deletePerdaMutation = useMutation({
    mutationFn: (id) => base44.entities.Perda.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perdas"] });
    },
  });

  const categoriasLabels = {
    financeiro: "Financeiro",
    timing: "Timing/Momento",
    confianca: "Confiança",
    concorrencia: "Concorrência",
    necessidade: "Necessidade/Produto",
    situacoes_esporadicas: "Situações Esporádicas",
    lead_invalido: "Lead Inválido"
  };

  const categoriasCores = {
    financeiro: "bg-red-100 text-red-800 border-l-red-400",
    timing: "bg-yellow-100 text-yellow-800 border-l-yellow-400",
    confianca: "bg-orange-100 text-orange-800 border-l-orange-400",
    concorrencia: "bg-purple-100 text-purple-800 border-l-purple-400",
    necessidade: "bg-blue-100 text-blue-800 border-l-blue-400",
    situacoes_esporadicas: "bg-teal-100 text-teal-800 border-l-teal-400",
    lead_invalido: "bg-slate-100 text-slate-800 border-l-slate-400"
  };

  // Identificar equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail && e.ativa);
  const membrosEquipe = minhaEquipe ? minhaEquipe.membros : [];
  const todosVendedoresEquipe = minhaEquipe ? [minhaEquipe.lider_email, ...membrosEquipe] : [userEmail];

  // Filtrar perdas por acesso
  let perdasVisiveis = perdas;
  if (userFuncao === "master") {
    // Master vê tudo
    perdasVisiveis = perdas;
  } else if (userFuncao === "lider") {
    perdasVisiveis = perdas.filter(p => todosVendedoresEquipe.includes(p.vendedor_email));
  } else if (userFuncao === "vendedor") {
    perdasVisiveis = perdas.filter(p => p.vendedor_email === userEmail);
  }

  // Aplicar filtros ativos
  if (filtrosAtivos.searchTerm) {
    perdasVisiveis = perdasVisiveis.filter(p =>
      p.nome_cliente?.toLowerCase().includes(filtrosAtivos.searchTerm.toLowerCase()) ||
      p.telefone?.includes(filtrosAtivos.searchTerm) ||
      p.placa?.toLowerCase().includes(filtrosAtivos.searchTerm.toLowerCase())
    );
  }

  if (filtrosAtivos.vendedorFilter.length > 0) {
    perdasVisiveis = perdasVisiveis.filter(p => filtrosAtivos.vendedorFilter.includes(p.vendedor_email));
  }

  if (filtrosAtivos.origemFilter.length > 0) {
    perdasVisiveis = perdasVisiveis.filter(p => filtrosAtivos.origemFilter.includes(p.origem));
  }

  if (filtrosAtivos.categoriaFilter.length > 0) {
    perdasVisiveis = perdasVisiveis.filter(p => filtrosAtivos.categoriaFilter.includes(p.categoria_motivo));
  }

  const handleRestore = (perda) => {
    const negociacaoData = {
      vendedor_email: perda.vendedor_email,
      etapa: perda.etapa_perda || "novo_lead",
      nome_cliente: perda.nome_cliente,
      telefone: perda.telefone,
      email: perda.email || "",
      placa: perda.placa || "",
      modelo_veiculo: perda.modelo_veiculo || "",
      plano_interesse: perda.plano_interesse || "",
      origem: perda.origem || "lead",
      data_entrada: perda.data_entrada || format(new Date(), "yyyy-MM-dd"),
      valor_mensalidade: perda.valor_mensalidade || "",
      valor_adesao: perda.valor_adesao || "",
      plataforma: perda.plataforma || "",
      campanha: perda.campanha || ""
    };

    createNegociacaoMutation.mutate(negociacaoData, {
      onSuccess: () => {
        deletePerdaMutation.mutate(perda.id);
        setShowDetails(false);
        setSelectedPerda(null);
      }
    });
  };

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const groupedPerdas = perdasVisiveis.reduce((acc, perda) => {
    const categoria = perda.categoria_motivo;
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(perda);
    return acc;
  }, {});

  const handleBuscar = () => {
    setFiltrosAtivos({
      searchTerm,
      vendedorFilter,
      origemFilter,
      categoriaFilter
    });
    setBuscaAtiva(true);
  };

  const handleLimpar = () => {
    setSearchTerm("");
    setVendedorFilter([]);
    setOrigemFilter([]);
    setCategoriaFilter([]);
    setFiltrosAtivos({
      searchTerm: "",
      vendedorFilter: [],
      origemFilter: [],
      categoriaFilter: []
    });
    setBuscaAtiva(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Panel */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total de Perdas</p>
                <p className="text-4xl font-bold text-slate-900">{perdasVisiveis.length}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-7 h-7 text-red-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Financeiro</p>
                <p className="text-4xl font-bold text-red-600">
                  {perdasVisiveis.filter(p => p.categoria_motivo === 'financeiro').length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Timing</p>
                <p className="text-4xl font-bold text-yellow-600">
                  {perdasVisiveis.filter(p => p.categoria_motivo === 'timing').length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Outras Categorias</p>
                <p className="text-4xl font-bold text-slate-600">
                  {perdasVisiveis.filter(p => !['financeiro', 'timing'].includes(p.categoria_motivo)).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Filtros</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Nome, telefone, placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <FiltroOrigem
                origensSelecionadas={origemFilter}
                onSelectionChange={setOrigemFilter}
              />
              <FiltroCategoriaPerdas
                categoriasSelecionadas={categoriaFilter}
                onSelectionChange={setCategoriaFilter}
              />
              {(userFuncao === "lider" || userFuncao === "master") && (
                <FiltroVendedor
                  vendedoresSelecionados={vendedorFilter}
                  todosVendedores={userFuncao === "master" 
                    ? allUsers.filter(u => u.funcao === "lider" || u.funcao === "vendedor").map(u => u.email)
                    : todosVendedoresEquipe
                  }
                  onSelectionChange={setVendedorFilter}
                  userEmail={userEmail}
                  nomesPorEmail={userFuncao === "master"
                    ? Object.fromEntries(allUsers.filter(u => u.funcao === "lider" || u.funcao === "vendedor").map(u => [u.email, u.nome_exibicao || u.full_name || u.email.split("@")[0]]))
                    : (minhaEquipe?.nomes_membros || {})
                  }
                />
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleBuscar} className="gap-2 bg-[#EFC200] hover:bg-[#D4A900] text-black font-semibold border-0">
              <Search className="w-4 h-4" />
              Buscar
            </Button>
            {buscaAtiva && (
              <Button variant="outline" onClick={handleLimpar} className="gap-2">
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => exportarCSV(perdasVisiveis, users)}
              disabled={perdasVisiveis.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header com controles de visualização */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="icon"
          onClick={() => setViewMode("list")}
          className={viewMode === "list" ? "bg-[#EFC200] hover:bg-[#D4A900] text-black" : ""}
        >
          <LayoutList className="w-5 h-5" />
        </Button>
        <Button
          variant={viewMode === "kanban" ? "default" : "outline"}
          size="icon"
          onClick={() => setViewMode("kanban")}
          className={viewMode === "kanban" ? "bg-[#EFC200] hover:bg-[#D4A900] text-black" : ""}
        >
          <LayoutGrid className="w-5 h-5" />
        </Button>
      </div>

      {/* Visualização em Lista */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Leads Perdidos</span>
              <Badge variant="secondary">{perdasVisiveis.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data da Perda</TableHead>
                    {userFuncao !== "vendedor" && <TableHead>Consultor</TableHead>}
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perdasVisiveis.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                        Nenhum lead perdido encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    perdasVisiveis.map((perda) => (
                      <TableRow key={perda.id}>
                        <TableCell className="font-medium">{perda.nome_cliente}</TableCell>
                        <TableCell>{perda.telefone}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {perda.origem ? perda.origem.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoriasCores[perda.categoria_motivo]}>
                            {categoriasLabels[perda.categoria_motivo]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{perda.motivo_perda}</TableCell>
                        <TableCell>
                          {format(new Date(perda.data_perda), "dd/MM/yyyy")}
                        </TableCell>
                        {userFuncao !== "vendedor" && (
                          <TableCell className="text-sm text-slate-600">
                            {getNomeVendedor(perda.vendedor_email)}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPerda(perda);
                                setShowDetails(true);
                              }}
                            >
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleRestore(perda)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restaurar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualização em Kanban */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {Object.entries(groupedPerdas).map(([categoria, perdasCategoria]) => (
              <Card key={categoria} className={`w-80 flex-shrink-0 border-l-4 ${categoriasCores[categoria]}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {categoriasLabels[categoria]}
                    </CardTitle>
                    <Badge variant="secondary">{perdasCategoria.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {perdasCategoria.map((perda) => (
                    <Card
                      key={perda.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedPerda(perda);
                        setShowDetails(true);
                      }}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="font-medium text-sm">{perda.nome_cliente}</div>
                        {perda.placa && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Car className="w-3 h-3" />
                            {perda.placa}
                          </div>
                        )}
                        <div className="text-xs text-slate-500">{perda.motivo_perda}</div>
                        <div className="text-xs text-slate-400">
                          {format(new Date(perda.data_perda), "dd/MM/yyyy")}
                        </div>
                        {userFuncao !== "vendedor" && (
                          <div className="text-xs text-slate-500 pt-1 border-t">
                            {getNomeVendedor(perda.vendedor_email)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sheet: Detalhes da Perda */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Lead Perdido</SheetTitle>
          </SheetHeader>
          {selectedPerda && (
            <div className="space-y-6 mt-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <Badge className={categoriasCores[selectedPerda.categoria_motivo] + " text-base"}>
                  {categoriasLabels[selectedPerda.categoria_motivo]}
                </Badge>
                <p className="text-lg font-medium mt-2">{selectedPerda.motivo_perda}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500">Cliente</Label>
                  <p className="font-medium text-lg">{selectedPerda.nome_cliente}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telefone
                  </Label>
                  <p className="font-medium">{selectedPerda.telefone}</p>
                </div>
                {selectedPerda.email && (
                  <div>
                    <Label className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </Label>
                    <p className="font-medium">{selectedPerda.email}</p>
                  </div>
                )}
                {selectedPerda.placa && (
                  <div>
                    <Label className="text-xs text-slate-500 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Placa
                    </Label>
                    <p className="font-medium">{selectedPerda.placa}</p>
                  </div>
                )}
                {selectedPerda.modelo_veiculo && (
                  <div>
                    <Label className="text-xs text-slate-500">Modelo do Veículo</Label>
                    <p className="font-medium">{selectedPerda.modelo_veiculo}</p>
                  </div>
                )}
                {selectedPerda.plano_interesse && (
                  <div>
                    <Label className="text-xs text-slate-500">Plano de Interesse</Label>
                    <p className="font-medium capitalize">{selectedPerda.plano_interesse}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-slate-500">Origem</Label>
                  <p className="font-medium capitalize">{selectedPerda.origem || "-"}</p>
                </div>
                {selectedPerda.valor_adesao && (
                  <div>
                    <Label className="text-xs text-slate-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Valor da Adesão
                    </Label>
                    <p className="font-medium">{selectedPerda.valor_adesao}</p>
                  </div>
                )}
                {selectedPerda.valor_mensalidade && (
                  <div>
                    <Label className="text-xs text-slate-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Valor da Mensalidade
                    </Label>
                    <p className="font-medium">{selectedPerda.valor_mensalidade}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data de Entrada
                  </Label>
                  <p className="font-medium">
                    {selectedPerda.data_entrada
                      ? format(new Date(selectedPerda.data_entrada), "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Data da Perda
                  </Label>
                  <p className="font-medium">
                    {format(new Date(selectedPerda.data_perda), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Etapa Perdida</Label>
                  <p className="font-medium capitalize">{selectedPerda.etapa_perda?.replace(/_/g, " ")}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Consultor Responsável
                  </Label>
                  <p className="font-medium">{getNomeVendedor(selectedPerda.vendedor_email)}</p>
                  <p className="text-sm text-slate-500">{selectedPerda.vendedor_email}</p>
                </div>
              </div>

              {selectedPerda.observacao_perda && (
                <div>
                  <Label className="text-xs text-slate-500">Observação Adicional</Label>
                  <p className="text-sm mt-1 p-3 bg-slate-50 rounded-md whitespace-pre-wrap">
                    {selectedPerda.observacao_perda}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleRestore(selectedPerda)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar para Negociações
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}