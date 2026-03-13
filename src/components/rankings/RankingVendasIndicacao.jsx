import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingVendasIndicacao({ negociacoes, users }) {
  const vendasIndicacao = negociacoes.filter(n => n.tem_indicacao === "sim" && n.etapa === "venda_ativa");

  const rankingArray = users && users.length > 0
    ? users
        .filter(u => u.funcao === "vendedor" || u.funcao === "lider")
        .map(user => {
          const total = vendasIndicacao.filter(v => v.email_vendedor === user.email).length;
          return { email: user.email, nome: user.nome_exibicao || user.full_name || user.email, total };
        })
        .sort((a, b) => b.total - a.total)
    : [];

  const getMedalIcon = (index) => {
    if (index === 0) return <div className="w-6 h-6 rounded-full bg-[#EFC200] text-slate-900 flex items-center justify-center font-bold text-xs shadow-sm">1</div>;
    if (index === 1) return <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">2</div>;
    if (index === 2) return <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">3</div>;
    return <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{index + 1}</div>;
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-slate-600" />
          <span>Vendas via Indicação</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-1">
        {rankingArray.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">Nenhuma venda via indicação neste período</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {rankingArray.map((vendedor, index) => (
              <motion.div
                key={vendedor.email}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                  index === 0 ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {getMedalIcon(index)}
                  <p className="font-semibold text-sm text-slate-900 truncate">{vendedor.nome}</p>
                </div>
                <div className="text-xl font-bold text-slate-900">{vendedor.total}</div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}