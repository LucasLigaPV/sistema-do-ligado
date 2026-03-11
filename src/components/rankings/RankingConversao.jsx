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
    if (index === 0) return <div className="w-6 h-6 rounded-full bg-[#EFC200] text-slate-900 flex items-center justify-center font-bold text-xs shadow-sm">1</div>;
    if (index === 1) return <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">2</div>;
    if (index === 2) return <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">3</div>;
    return <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{index + 1}</div>;
  };

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-slate-600" />
          <span>% Conversão</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-2">
        <div className="space-y-2">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-sm">Nenhum dado</p>
          ) : rankingArray.slice(0, 5).map((vendedor, index) => (
            <motion.div
              key={vendedor.email}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                index === 0 ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {getMedalIcon(index)}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-900 truncate">{vendedor.nome}</p>
                  <p className="text-[10px] text-slate-500">{vendedor.vendas}/{vendedor.leads} leads</p>
                </div>
              </div>
              <div className="text-xl font-bold text-[#EFC200]">{vendedor.conversao.toFixed(1)}%</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}