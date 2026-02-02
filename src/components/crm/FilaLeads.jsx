import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Eye, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  novo: { label: "Novo", color: "bg-blue-500" },
  contatado: { label: "Contatado", color: "bg-yellow-500" },
  qualificado: { label: "Qualificado", color: "bg-purple-500" },
  convertido: { label: "Convertido", color: "bg-green-500" },
  perdido: { label: "Perdido", color: "bg-red-500" },
};

export default function FilaLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterPlataforma, setFilterPlataforma] = useState("todas");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const filteredLeads = leads.filter((lead) => {
    const matchSearch =
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm);
    const matchStatus = filterStatus === "todos" || lead.status === filterStatus;
    const matchPlataforma =
      filterPlataforma === "todas" || lead.plataforma === filterPlataforma;
    return matchSearch && matchStatus && matchPlataforma;
  });

  const plataformas = [...new Set(leads.map((l) => l.plataforma).filter(Boolean))];

  const handleStatusChange = (leadId, newStatus) => {
    updateLeadMutation.mutate({
      id: leadId,
      data: { status: newStatus },
    });
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setShowDetails(true);
  };

  const stats = {
    total: leads.length,
    novos: leads.filter((l) => l.status === "novo").length,
    contatados: leads.filter((l) => l.status === "contatado").length,
    convertidos: leads.filter((l) => l.status === "convertido").length,
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Novos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.novos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Contatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.contatados}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Convertidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.convertidos}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contatado">Contatado</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlataforma} onValueChange={setFilterPlataforma}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Plataformas</SelectItem>
                {plataformas.map((plat) => (
                  <SelectItem key={plat} value={plat}>
                    {plat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              Carregando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum lead encontrado
            </div>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="whitespace-nowrap">
                        {lead.data
                          ? format(new Date(lead.data), "dd/MM/yyyy")
                          : format(new Date(lead.created_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.telefone}</div>
                          <div className="text-slate-500 text-xs">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lead.modelo || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.plataforma || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {lead.campanha || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) =>
                            handleStatusChange(lead.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  statusConfig[lead.status]?.color
                                }`}
                              />
                              <span>{statusConfig[lead.status]?.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${config.color}`}
                                  />
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(lead)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas sobre o lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Nome</label>
                  <p className="text-sm mt-1">{selectedLead.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Data de Entrada
                  </label>
                  <p className="text-sm mt-1">
                    {selectedLead.data
                      ? format(new Date(selectedLead.data), "dd/MM/yyyy")
                      : format(new Date(selectedLead.created_date), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    E-mail
                  </label>
                  <p className="text-sm mt-1">{selectedLead.email || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Telefone
                  </label>
                  <p className="text-sm mt-1">{selectedLead.telefone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Modelo
                  </label>
                  <p className="text-sm mt-1">{selectedLead.modelo || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Status
                  </label>
                  <p className="text-sm mt-1">
                    <Badge className={statusConfig[selectedLead.status]?.color}>
                      {statusConfig[selectedLead.status]?.label}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informações de Tráfego</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Plataforma
                    </label>
                    <p className="text-sm mt-1">
                      {selectedLead.plataforma || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Posicionamento
                    </label>
                    <p className="text-sm mt-1">
                      {selectedLead.posicionamento || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Campanha
                    </label>
                    <p className="text-sm mt-1">{selectedLead.campanha || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Conjunto de Anúncios
                    </label>
                    <p className="text-sm mt-1">{selectedLead.adset || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Anúncio
                    </label>
                    <p className="text-sm mt-1">{selectedLead.ad || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Página
                    </label>
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