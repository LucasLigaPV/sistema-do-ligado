import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import RankingVendas from "../components/rankings/RankingVendas";
import RankingVendasLead from "../components/rankings/RankingVendasLead";
import RankingVendasIndicacao from "../components/rankings/RankingVendasIndicacao";
import RankingCotacoes from "../components/rankings/RankingCotacoes";
import RankingNegociacoesAtivas from "../components/rankings/RankingNegociacoesAtivas";
import RankingPerdas from "../components/rankings/RankingPerdas";
import RankingIndicacoesRecebidasNeg from "../components/rankings/RankingIndicacoesRecebidas";

export default function Rankings() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin();
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-data_venda"),
    enabled: isAuthenticated,
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
    enabled: isAuthenticated,
  });

  const { data: perdas = [] } = useQuery({
    queryKey: ["perdas"],
    queryFn: () => base44.entities.Perda.list(),
    enabled: isAuthenticated,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAuthenticated,
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-[#EFC200] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-[#EFC200]" />
            <h1 className="text-3xl font-bold text-slate-900">Rankings</h1>
          </div>
          <p className="text-slate-600">Acompanhe o desempenho e celebre as conquistas da equipe</p>
        </motion.div>

        {/* Filtros de Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200 mb-8">
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
        <div className="space-y-8">
          {/* Ranking Geral de Vendas + Vendas Lead/Indicação */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <RankingVendas vendas={vendasFiltradas} users={users} />
            </motion.div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <RankingVendasLead vendas={vendasFiltradas} users={users} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <RankingVendasIndicacao vendas={vendasFiltradas} users={users} />
              </motion.div>
            </div>
          </div>

          {/* Rankings de Negociações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <RankingCotacoes negociacoes={negociacoes} users={users} />
            </motion.div>
          </div>

          {/* Rankings de Indicações e Perdas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <RankingIndicacoesRecebidasNeg negociacoes={negociacoes} perdas={perdasFiltradas} users={users} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <RankingPerdas perdas={perdasFiltradas} users={users} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}