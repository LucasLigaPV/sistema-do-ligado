import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { motion } from "framer-motion";
import ResumoIndicacoes from "../dashboard/ResumoIndicacoes";
import TopIndicadores from "../dashboard/TopIndicadores";
import TopConsultores from "../dashboard/TopConsultores";

export default function DashboardContent({ userEmail, userRole }) {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [consultorFilter, setConsultorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: allIndicacoes = [], isLoading } = useQuery({
    queryKey: ["indicacoes"],
    queryFn: () => base44.entities.Indicacao.list("-created_date"),
  });

  const indicacoes = (userRole === "admin" || userRole === "lider")
    ? allIndicacoes 
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
    if (consultorFilter !== "all" && ind.consultor_responsavel !== consultorFilter) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Consultor</Label>
              <Select value={consultorFilter} onValueChange={setConsultorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
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

            {(userRole === "admin" || userRole === "lider") && (
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