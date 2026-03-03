import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, AlertTriangle, Trash2, RotateCcw, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toZonedTime, format as formatTZ } from "date-fns-tz";

const TZ = "America/Sao_Paulo";

const toUTC = (isoString) => {
  if (!isoString) return null;
  const s = isoString.trim();
  return /[Z+\-]\d*$/.test(s) ? new Date(s) : new Date(s + "Z");
};

const formatBR = (isoString, fmt) => {
  const d = toUTC(isoString);
  if (!d) return "-";
  return formatTZ(toZonedTime(d, TZ), fmt, { timeZone: TZ });
};

const isTodayBR = (isoString) => {
  const d = toUTC(isoString);
  if (!d) return false;
  const zonedDate = toZonedTime(d, TZ);
  const zonedNow = toZonedTime(new Date(), TZ);
  return formatTZ(zonedDate, "yyyy-MM-dd", { timeZone: TZ }) === formatTZ(zonedNow, "yyyy-MM-dd", { timeZone: TZ });
};

export default function FilaLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlataforma, setFilterPlataforma] = useState("todas");
  const [filterPosicionamento, setFilterPosicionamento] = useState("todos");
  const [filterAd, setFilterAd] = useState("todos");
  const [filterAdset, setFilterAdset] = useState("todos");
  const [filterCampanha, setFilterCampanha] = useState("todas");
  const [filterPagina, setFilterPagina] = useState("todas");
  const [filterDistribuido, setFilterDistribuido] = useState("nao_distribuido");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleArquivar = (lead, tipo) => {
    const label = tipo === "invalido" ? "lead inválido" : "limpeza";
    if (window.confirm(`Mover "${lead.nome}" para ${label}?`)) {
      updateLeadMutation.mutate({
        id: lead.id,
        data: { status_arquivamento: tipo, data_arquivamento: new Date().toISOString() }
      });
    }
  };

  const handleRestaurar = (lead) => {
    updateLeadMutation.mutate({
      id: lead.id,
      data: { status_arquivamento: null, data_arquivamento: null }
    });
  };

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Lead.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Separar leads ativos dos arquivados
  const leadsAtivos = leads.filter(l => !l.status_arquivamento);
  const leadsInvalidos = leads.filter(l => l.status_arquivamento === "invalido");
  const leadsLimpeza = leads.filter(l => l.status_arquivamento === "limpeza");

  const filteredLeads = leadsAtivos.filter((lead) => {
    const leadDate = lead.data ? new Date(lead.data) : new Date(lead.created_date);
    const matchDate = (!startDate || leadDate >= new Date(startDate)) &&
                      (!endDate || leadDate <= new Date(endDate + "T23:59:59"));
    const matchSearch =
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm);
    const matchPlataforma = filterPlataforma === "todas" || lead.plataforma === filterPlataforma;
    const matchPosicionamento = filterPosicionamento === "todos" || lead.posicionamento === filterPosicionamento;
    const matchAd = filterAd === "todos" || lead.ad === filterAd;
    const matchAdset = filterAdset === "todos" || lead.adset === filterAdset;
    const matchCampanha = filterCampanha === "todas" || lead.campanha === filterCampanha;
    const matchPagina = filterPagina === "todas" || lead.pagina === filterPagina;
    const matchDistribuido = filterDistribuido === "todos" ||
      (filterDistribuido === "nao_distribuido" && !lead.distribuido) ||
      (filterDistribuido === "distribuido" && lead.distribuido);
    return matchDate && matchSearch && matchPlataforma && matchPosicionamento && matchAd && matchAdset && matchCampanha && matchPagina && matchDistribuido;
  });

  const plataformas = [...new Set(leadsAtivos.map((l) => l.plataforma).filter(Boolean))];
  const posicionamentos = [...new Set(leadsAtivos.map((l) => l.posicionamento).filter(Boolean))];
  const ads = [...new Set(leadsAtivos.map((l) => l.ad).filter(Boolean))];
  const adsets = [...new Set(leadsAtivos.map((l) => l.adset).filter(Boolean))];
  const campanhas = [...new Set(leadsAtivos.map((l) => l.campanha).filter(Boolean))];
  const paginas = [...new Set(leadsAtivos.map((l) => l.pagina).filter(Boolean))];

  const stats = {
    total: filteredLeads.length,
    novos: leadsAtivos.filter((l) => isTodayBR(l.created_date || l.data)).length,
    naFila: filteredLeads.filter((l) => !l.distribuido).length,
  };

  const LeadRow = ({ lead, showArchiveActions = true }) => (
    <TableRow key={lead.id}>
      <TableCell className="whitespace-nowrap">
        <div>{lead.data ? formatBR(lead.data, "dd/MM/yyyy") : formatBR(lead.created_date, "dd/MM/yyyy")}</div>
        {lead.created_date && <div className="text-xs text-slate-400">{formatBR(lead.created_date, "HH:mm")}</div>}
      </TableCell>
      <TableCell className="font-medium">{lead.nome}</TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{lead.telefone}</div>
          <div className="text-slate-500 text-xs">{lead.email}</div>
        </div>
      </TableCell>
      <TableCell>{lead.modelo || "-"}</TableCell>
      <TableCell><Badge variant="outline">{lead.plataforma || "-"}</Badge></TableCell>
      <TableCell className="text-sm text-slate-600">{lead.campanha || "-"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedLead(lead); setShowDetails(true); }}>
            <Eye className="w-4 h-4" />
          </Button>
          {showArchiveActions ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArquivar(lead, "invalido")}
                    className="text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-0 shadow-xl px-3 py-2 text-xs font-medium rounded-lg animate-in fade-in-0 zoom-in-95">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />
                    Modelo ou Número Incompleto
                  </div>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArquivar(lead, "limpeza")}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-0 shadow-xl px-3 py-2 text-xs font-medium rounded-lg animate-in fade-in-0 zoom-in-95">
                  <div className="flex items-center gap-1.5">
                    <Trash2 className="w-3 h-3 text-slate-400 shrink-0" />
                    Leads Duplicados origem multi-step
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRestaurar(lead)}
              className="text-green-600 hover:text-green-800 hover:bg-green-50"
              title="Restaurar lead"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  const ArchivedTable = ({ items, emptyText }) => (
    items.length === 0 ? (
      <div className="text-center py-8 text-slate-500">{emptyText}</div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((lead) => <LeadRow key={lead.id} lead={lead} showArchiveActions={false} />)}
          </TableBody>
        </Table>
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fila">
        <TabsList className="bg-transparent p-0 gap-3 h-auto border-0">
          <TabsTrigger value="fila" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <List className="w-4 h-4" />
            Fila de Leads
          </TabsTrigger>
          <TabsTrigger value="invalidos" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <AlertTriangle className="w-4 h-4" />
            Leads Inválidos
            {leadsInvalidos.length > 0 && (
              <span className="ml-1 bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">{leadsInvalidos.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="limpeza" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <Trash2 className="w-4 h-4" />
            Limpeza
            {leadsLimpeza.length > 0 && (
              <span className="ml-1 bg-slate-100 text-slate-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{leadsLimpeza.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Fila Principal */}
        <TabsContent value="fila" className="space-y-6 mt-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Novos (Hoje)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.novos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Na Fila</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EFC200]">{stats.naFila}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex gap-2">
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Data Inicial</label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full md:w-[160px]" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 mb-1 block">Data Final</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full md:w-[160px]" />
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <label className="text-xs text-slate-600 mb-1 block">Buscar</label>
                    <Search className="absolute left-3 top-[34px] transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Nome, email ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                  <Select value={filterPlataforma} onValueChange={setFilterPlataforma}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Plataforma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas Plataformas</SelectItem>
                      {plataformas.map((plat) => <SelectItem key={plat} value={plat}>{plat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterCampanha} onValueChange={setFilterCampanha}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Campanha" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas Campanhas</SelectItem>
                      {campanhas.map((camp) => <SelectItem key={camp} value={camp}>{camp}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterAdset} onValueChange={setFilterAdset}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Conjunto de Anúncios" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Conjuntos</SelectItem>
                      {adsets.map((adset) => <SelectItem key={adset} value={adset}>{adset}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterAd} onValueChange={setFilterAd}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Anúncio" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Anúncios</SelectItem>
                      {ads.map((ad) => <SelectItem key={ad} value={ad}>{ad}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterPosicionamento} onValueChange={setFilterPosicionamento}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Posicionamento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Posicionamentos</SelectItem>
                      {posicionamentos.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterPagina} onValueChange={setFilterPagina}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Página" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Páginas</SelectItem>
                      {paginas.map((pag) => <SelectItem key={pag} value={pag}>{pag}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterDistribuido} onValueChange={setFilterDistribuido}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Distribuição" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="nao_distribuido">Não Distribuídos</SelectItem>
                      <SelectItem value="distribuido">Distribuídos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Fila de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Carregando leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Nenhum lead encontrado</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => <LeadRow key={lead.id} lead={lead} showArchiveActions={true} />)}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Inválidos */}
        <TabsContent value="invalidos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Leads Inválidos
              </CardTitle>
              <p className="text-sm text-slate-500">Leads marcados como inválidos. Podem ser restaurados à fila principal.</p>
            </CardHeader>
            <CardContent>
              <ArchivedTable items={leadsInvalidos} emptyText="Nenhum lead inválido registrado" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limpeza */}
        <TabsContent value="limpeza" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-slate-500" />
                Limpeza
              </CardTitle>
              <p className="text-sm text-slate-500">Leads removidos da fila. Podem ser restaurados à fila principal.</p>
            </CardHeader>
            <CardContent>
              <ArchivedTable items={leadsLimpeza} emptyText="Nenhum lead na limpeza" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>Informações completas sobre o lead</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Nome</label>
                  <p className="text-sm mt-1">{selectedLead.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Data de Entrada</label>
                  <p className="text-sm mt-1">
                    {selectedLead.data ? formatBR(selectedLead.data, "dd/MM/yyyy") : formatBR(selectedLead.created_date, "dd/MM/yyyy")}
                    {selectedLead.created_date && ` às ${formatBR(selectedLead.created_date, "HH:mm")}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">E-mail</label>
                  <p className="text-sm mt-1">{selectedLead.email || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Telefone</label>
                  <p className="text-sm mt-1">{selectedLead.telefone}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-slate-600">Modelo</label>
                  <p className="text-sm mt-1">{selectedLead.modelo || "-"}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informações de Tráfego</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Plataforma</label>
                    <p className="text-sm mt-1">{selectedLead.plataforma || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Posicionamento</label>
                    <p className="text-sm mt-1">{selectedLead.posicionamento || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Campanha</label>
                    <p className="text-sm mt-1">{selectedLead.campanha || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Conjunto de Anúncios</label>
                    <p className="text-sm mt-1">{selectedLead.adset || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Anúncio</label>
                    <p className="text-sm mt-1">{selectedLead.ad || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Página</label>
                    <p className="text-sm mt-1">{selectedLead.pagina || "-"}</p>
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