import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingNegociacoesAtivas({ negociacoes, users }) {
  const ranking = {};

  negociacoes.forEach(neg => {
    const email = neg.vendedor_email;
    if (!ranking[email]) {
      ranking[email] = {
        total: 0,
        novo_lead: 0,
        abordagem: 0,
        sondagem: 0,
        apresentacao: 0,
        cotacao: 0,
        em_negociacao: 0,
        vistoria_assinatura_pix: 0
      };
    }
    ranking[email].total++;
    if (neg.etapa) ranking[email][neg.etapa]++;
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, ...dados };
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
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600" />
          Negociações Ativas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankingArray.map((vendedor, index) => (
            <motion.div
              key={vendedor.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${
                index === 0 ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  {getMedalIcon(index)}
                  <p className="font-semibold text-slate-900">{vendedor.nome}</p>
                </div>
                <div className="text-2xl font-bold text-slate-900">{vendedor.total}</div>
              </div>
              <div className="flex gap-2 flex-wrap ml-12">
                {vendedor.novo_lead > 0 && <Badge variant="outline" className="text-xs">Novo: {vendedor.novo_lead}</Badge>}
                {vendedor.cotacao > 0 && <Badge variant="outline" className="text-xs">Cotação: {vendedor.cotacao}</Badge>}
                {vendedor.em_negociacao > 0 && <Badge variant="outline" className="text-xs">Negociação: {vendedor.em_negociacao}</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}