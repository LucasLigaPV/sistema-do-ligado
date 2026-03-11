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
    <div className="space-y-4">
      {/* Filtros de Data - Compacto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-fit">
                <Calendar className="w-4 h-4 text-[#EFC200]" />
                <h3 className="text-sm font-semibold text-slate-900">Período</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-auto">
        {/* Ranking Geral - Destaque Principal (Largura completa) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-12"
        >
          <RankingVendas vendas={vendasFiltradas} users={users} />
        </motion.div>

        {/* Vendas Lead - Médio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-6"
        >
          <RankingVendasLead vendas={vendasFiltradas} users={users} />
        </motion.div>

        {/* Vendas Indicação - Médio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-6"
        >
          <RankingVendasIndicacao vendas={vendasFiltradas} users={users} />
        </motion.div>

        {/* Conversão - Médio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4"
        >
          <RankingConversao vendas={vendasFiltradas} negociacoes={negociacoes} perdas={perdasFiltradas} users={users} />
        </motion.div>

        {/* Adesão Média - Médio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4"
        >
          <RankingAdesaoMedia vendas={vendasFiltradas} users={users} />
        </motion.div>

        {/* Negociações Ativas - Médio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4"
        >
          <RankingNegociacoesAtivas negociacoes={negociacoes} users={users} />
        </motion.div>

        {/* Indicações Recebidas - Grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-7"
        >
          <RankingIndicacoesRecebidasNeg negociacoes={negociacoes} perdas={perdasFiltradas} users={users} />
        </motion.div>

        {/* Perdas - Grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-5"
        >
          <RankingPerdas perdas={perdasFiltradas} users={users} />
        </motion.div>
      </div>
    </div>
  );
}