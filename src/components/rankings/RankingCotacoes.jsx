import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingCotacoes({ negociacoes, users }) {
  const cotacoes = negociacoes.filter(n => n.etapa === "cotacao");
  const ranking = {};

  // Inicializar todos os vendedores com 0
  users.forEach(user => {
    if (user.funcao === "vendedor" || user.funcao === "lider") {
      ranking[user.email] = 0;
    }
  });

  cotacoes.forEach(neg => {
    const email = neg.vendedor_email;
    if (ranking[email] !== undefined) ranking[email]++;
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, total]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const getMedalIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-slate-700" />;
    if (index === 1) return <Award className="w-5 h-5 text-slate-500" />;
    if (index === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    return <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">{index + 1}</div>;
  };

  return (
    <Card className="border-slate-200 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Cotações Ativas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-3">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma cotação ativa encontrada</p>
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
              <div className="flex items-center gap-4">
                {getMedalIcon(index)}
                <p className="font-semibold text-slate-900">{vendedor.nome}</p>
              </div>
              <div className="text-2xl font-bold text-slate-900">{vendedor.total}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}