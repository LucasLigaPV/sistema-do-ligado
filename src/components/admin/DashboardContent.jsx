import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { motion } from "framer-motion";
import ResumoIndicacoes from "../dashboard/ResumoIndicacoes";
import TopIndicadores from "../dashboard/TopIndicadores";
import TopConsultores from "../dashboard/TopConsultores";

export default function DashboardContent({ userEmail, userRole, userFuncao }) {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [consultorFilter, setConsultorFilter] = useState(userFuncao === "lider" ? [userEmail] : (userRole === "admin" ? [] : [userEmail]));
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: allIndicacoes = [], isLoading } = useQuery({
    queryKey: ["indicacoes"],
    queryFn: () => base44.entities.Indicacao.list("-created_date"),
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

  const indicacoes = userRole === "admin" 
    ? allIndicacoes 
    : userFuncao === "lider"
    ? allIndicacoes.filter(ind => membrosEquipe.includes(ind.consultor_responsavel))
    : allIndicacoes.filter(ind => ind.consultor_responsavel === userEmail);

  const { data: configs = [] } = useQuery({
    queryKey: ["configs"],
    queryFn: () => base44.entities.ConfiguracaoFormulario.list(),
  });

  const consultores = configs.find((c) => c.tipo === "consultores")?.opcoes || [];

  // Aplicar filtros
  const filteredIndicacoes = indicacoes.filter((ind) => {
    // Filtro de data
    if (dataInicio) {
      const dataInd = new Date(ind.created_date);
      const inicio = new Date(dataInicio);
      if (dataInd < inicio) return false;
    }
    if (dataFim) {
      const dataInd = new Date(ind.created_date);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999); // Incluir o dia inteiro
      if (dataInd > fim) return false;
    }

    // Filtro de consultor
    if (consultorFilter.length > 0 && !consultorFilter.includes(ind.consultor_responsavel)) {
      return false;
    }

    // Filtro de status
    if (statusFilter !== "all" && ind.status !== statusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Filtros</h3>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${(userRole === "admin" || userFuncao === "lider") ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full"
              />
            </div>
            {(userRole === "admin" || userFuncao === "lider") && (
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Vendedor</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Filter className="w-4 h-4 mr-2" />
                      {consultorFilter.length === 0 
                        ? "Todos" 
                        : consultorFilter.length === 1
                        ? (userFuncao === "lider" 
                            ? (users.find(u => u.email === consultorFilter[0])?.full_name || consultorFilter[0])
                            : consultorFilter[0])
                        : `${consultorFilter.length} selecionados`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          checked={consultorFilter.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) setConsultorFilter([]);
                          }}
                        />
                        <span className="text-sm font-medium">Todos</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {userFuncao === "lider" ? (
                          membrosEquipe.map((email) => {
                            const user = users.find(u => u.email === email);
                            const nome = user?.full_name || email;
                            return (
                              <div key={email} className="flex items-center gap-2">
                                <Checkbox
                                  checked={consultorFilter.includes(email)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setConsultorFilter([...consultorFilter, email]);
                                    } else {
                                      setConsultorFilter(consultorFilter.filter(c => c !== email));
                                    }
                                  }}
                                />
                                <span className="text-sm">{nome}</span>
                              </div>
                            );
                          })
                        ) : (
                          consultores.map((c) => (
                            <div key={c} className="flex items-center gap-2">
                              <Checkbox
                                checked={consultorFilter.includes(c)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setConsultorFilter([...consultorFilter, c]);
                                  } else {
                                    setConsultorFilter(consultorFilter.filter(f => f !== c));
                                  }
                                }}
                              />
                              <span className="text-sm">{c}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
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
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Resumo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ResumoIndicacoes indicacoes={filteredIndicacoes} />
          </motion.div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TopIndicadores indicacoes={filteredIndicacoes} />
            </motion.div>

            {(userRole === "admin" || userFuncao === "lider") && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TopConsultores indicacoes={filteredIndicacoes} />
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}