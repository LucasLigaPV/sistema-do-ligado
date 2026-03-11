import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import RankingVendas from "./RankingVendas";
import RankingVendasLead from "./RankingVendasLead";
import RankingVendasIndicacao from "./RankingVendasIndicacao";
import RankingNegociacoesAtivas from "./RankingNegociacoesAtivas";
import RankingPerdas from "./RankingPerdas";
import RankingIndicacoesRecebidasNeg from "./RankingIndicacoesRecebidas";
import RankingConversao from "./RankingConversao";
import RankingAdesaoMedia from "./RankingAdesaoMedia";

export default function DashboardRankings() {
  // Definir mês vigente como padrão
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(ultimoDiaMes.toISOString().split('T')[0]);

  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-data_venda"),
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: perdas = [] } = useQuery({
    queryKey: ["perdas"],
    queryFn: () => base44.entities.Perda.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Filtrar por data
  const vendasFiltradas = vendas.filter(v => {
    if (dataInicio && new Date(v.data_venda) < new Date(dataInicio)) return false;
    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      if (new Date(v.data_venda) > fim) return false;
    }
    return true;
  });

  const perdasFiltradas = perdas.filter(p => {
    if (dataInicio && new Date(p.data_perda) < new Date(dataInicio)) return false;
    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);
      if (new Date(p.data_perda) > fim) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtros de Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Período</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid de Rankings */}
      <div className="space-y-6">
        {/* Ranking Geral de Vendas - Destaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RankingVendas vendas={vendasFiltradas} users={users} />
        </motion.div>

        {/* Grid de Rankings em 2 colunas */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RankingVendasLead vendas={vendasFiltradas} users={users} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RankingVendasIndicacao vendas={vendasFiltradas} users={users} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RankingNegociacoesAtivas negociacoes={negociacoes} users={users} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RankingConversao vendas={vendasFiltradas} negociacoes={negociacoes} perdas={perdasFiltradas} users={users} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <RankingAdesaoMedia vendas={vendasFiltradas} users={users} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <RankingIndicacoesRecebidasNeg negociacoes={negociacoes} perdas={perdasFiltradas} users={users} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <RankingPerdas perdas={perdasFiltradas} users={users} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}