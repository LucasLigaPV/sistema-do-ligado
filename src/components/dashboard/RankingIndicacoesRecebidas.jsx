import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingIndicacoesRecebidas() {
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

  // Filtrar negociações e perdas com origem indicação
  const negociacoesIndicacao = negociacoes.filter(n => n.origem === "indicacao");
  const perdasIndicacao = perdas.filter(p => p.origem === "indicacao");

  // Combinar e contar por vendedor
  const ranking = {};

  negociacoesIndicacao.forEach(neg => {
    const email = neg.vendedor_email;
    if (!ranking[email]) {
      ranking[email] = { ativas: 0, perdidas: 0, total: 0 };
    }
    ranking[email].ativas++;
    ranking[email].total++;
  });

  perdasIndicacao.forEach(perda => {
    const email = perda.vendedor_email;
    if (!ranking[email]) {
      ranking[email] = { ativas: 0, perdidas: 0, total: 0 };
    }
    ranking[email].perdidas++;
    ranking[email].total++;
  });

  // Converter para array e ordenar
  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return {
        email,
        nome: user?.full_name || email,
        ...dados
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const totalIndicacoes = negociacoesIndicacao.length + perdasIndicacao.length;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          Ranking de Indicações Recebidas
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Negociações ativas e perdidas originadas de indicação
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {rankingArray.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma negociação de indicação registrada</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{totalIndicacoes}</div>
                <div className="text-sm text-slate-600 mt-1">Total de Indicações Recebidas</div>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rankingArray.map((vendedor, index) => (
                <motion.div
                  key={vendedor.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${
                      index === 0 
                        ? 'bg-[#EFC200] text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {index === 0 ? <Award className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate" title={vendedor.nome}>
                        {vendedor.nome}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-600">
                        <span>{vendedor.ativas} recebidas</span>
                        <span>•</span>
                        <span>{vendedor.perdidas} perdidas</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-slate-900">
                      {vendedor.total}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}