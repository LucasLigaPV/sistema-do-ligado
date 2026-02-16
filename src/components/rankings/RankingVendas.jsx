import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingVendas({ vendas, users }) {
  const ranking = {};

  vendas.forEach(venda => {
    const email = venda.email_vendedor;
    if (!ranking[email]) {
      ranking[email] = {
        total: 0,
        essencial: 0,
        principal: 0,
        van: 0,
        moto: 0,
        caminhao: 0
      };
    }
    ranking[email].total++;
    if (venda.plano_vendido === "essencial") ranking[email].essencial++;
    if (venda.plano_vendido === "principal") ranking[email].principal++;
    if (venda.plano_vendido === "plano_van") ranking[email].van++;
    if (venda.plano_vendido === "plano_moto") ranking[email].moto++;
    if (venda.plano_vendido === "plano_caminhao") ranking[email].caminhao++;
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
          <Trophy className="w-5 h-5 text-slate-700" />
          Ranking Geral de Vendas
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
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                index === 0 ? 'bg-slate-50 border-slate-300 shadow-sm' :
                'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                {getMedalIcon(index)}
                <div>
                  <p className="font-semibold text-slate-900">{vendedor.nome}</p>
                  <div className="flex gap-2 mt-1">
                    {vendedor.essencial > 0 && <Badge variant="outline" className="text-xs">Essencial: {vendedor.essencial}</Badge>}
                    {vendedor.principal > 0 && <Badge variant="outline" className="text-xs">Principal: {vendedor.principal}</Badge>}
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{vendedor.total}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}