import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingConversao({ vendas, negociacoes, perdas, users }) {
  const ranking = {};

  // Contar negociações (leads) por vendedor
  negociacoes.forEach(neg => {
    const email = neg.vendedor_email;
    if (!ranking[email]) {
      ranking[email] = { leads: 0, vendas: 0, conversao: 0 };
    }
    ranking[email].leads++;
  });

  // Contar perdas (excluindo lead_invalido) por vendedor
  perdas.filter(p => p.categoria_motivo !== 'lead_invalido').forEach(perda => {
    const email = perda.vendedor_email;
    if (!ranking[email]) {
      ranking[email] = { leads: 0, vendas: 0, conversao: 0 };
    }
    ranking[email].leads++;
  });

  // Contar vendas por vendedor
  vendas.forEach(venda => {
    const email = venda.email_vendedor;
    if (!ranking[email]) {
      ranking[email] = { leads: 0, vendas: 0, conversao: 0 };
    }
    ranking[email].vendas++;
  });

  // Calcular percentual de conversão
  Object.keys(ranking).forEach(email => {
    const { leads, vendas } = ranking[email];
    ranking[email].conversao = leads > 0 ? (vendas / leads) * 100 : 0;
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, ...dados };
    })
    .sort((a, b) => b.conversao - a.conversao)
    .slice(0, 10);

  const getMedalIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-slate-700" />;
    if (index === 1) return <Award className="w-5 h-5 text-slate-500" />;
    if (index === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    return <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">{index + 1}</div>;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          % de Conversão de Lead
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum dado encontrado</p>
          ) : rankingArray.map((vendedor, index) => (
            <motion.div
              key={vendedor.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                index === 0 ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                {getMedalIcon(index)}
                <div>
                  <p className="font-semibold text-slate-900">{vendedor.nome}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {vendedor.vendas} vendas / {vendedor.leads} leads
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{vendedor.conversao.toFixed(1)}%</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}