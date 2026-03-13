import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingIndicacoesRecebidasNeg({ negociacoes, perdas, users }) {
  const negociacoesIndicacao = negociacoes.filter(n => n.origem === "indicacao");
  const perdasIndicacao = perdas.filter(p => p.origem === "indicacao" && p.categoria_motivo !== "lead_invalido");
  
  const ranking = {};

  // Inicializar todos os vendedores com 0
  users.forEach(user => {
    if (user.funcao === "vendedor" || user.funcao === "lider") {
      ranking[user.email] = { recebidas: 0, emNegociacao: 0, perdidas: 0 };
    }
  });

  negociacoesIndicacao.forEach(neg => {
    const email = neg.vendedor_email;
    if (ranking[email]) {
      ranking[email].recebidas++;
      if (neg.etapa !== "venda_ativa") {
        ranking[email].emNegociacao++;
      }
    }
  });

  perdasIndicacao.forEach(perda => {
    const email = perda.vendedor_email;
    if (ranking[email]) {
      ranking[email].recebidas++;
      ranking[email].perdidas++;
    }
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      const nome = user?.full_name || email.split('@')[0];
      return { email, nome, ...dados };
    })
    .sort((a, b) => b.recebidas - a.recebidas);

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
          <span>Indicações Recebidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto space-y-2">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-sm">Nenhuma indicação</p>
          ) : rankingArray.map((vendedor, index) => (
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
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-900 truncate">{vendedor.nome}</p>
                  <p className="text-[10px] text-slate-500">
                    {vendedor.emNegociacao} negoc. • {vendedor.perdidas} perdidas
                  </p>
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 flex-shrink-0">{vendedor.recebidas}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}