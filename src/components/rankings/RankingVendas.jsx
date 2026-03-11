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
        plano_van: 0,
        plano_moto: 0,
        plano_caminhao: 0
      };
    }
    ranking[email].total++;
    if (venda.plano_vendido === "essencial") ranking[email].essencial++;
    if (venda.plano_vendido === "principal") ranking[email].principal++;
    if (venda.plano_vendido === "plano_van") ranking[email].plano_van++;
    if (venda.plano_vendido === "plano_moto") ranking[email].plano_moto++;
    if (venda.plano_vendido === "plano_caminhao") ranking[email].plano_caminhao++;
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, ...dados };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const getMedalIcon = (index) => {
    if (index === 0) return <div className="w-7 h-7 rounded-full bg-[#EFC200] text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm">1</div>;
    if (index === 1) return <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm">2</div>;
    if (index === 2) return <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">3</div>;
    return <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{index + 1}</div>;
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden bg-gradient-to-br from-white to-slate-50/30">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-2 rounded-lg bg-[#FFF9E6]">
            <Trophy className="w-4 h-4 text-[#EFC200]" />
          </div>
          <span className="text-slate-900">Ranking Geral de Vendas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rankingArray.slice(0, 6).map((vendedor, index) => (
            <motion.div
              key={vendedor.email}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`relative p-3 rounded-lg border transition-all ${
                index === 0 ? 'bg-gradient-to-br from-[#FFF9E6] to-[#FFFAED] border-[#EFC200]/30 shadow-sm' :
                'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getMedalIcon(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{vendedor.nome}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {vendedor.essencial > 0 && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Ess: {vendedor.essencial}</Badge>}
                    {vendedor.principal > 0 && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Princ: {vendedor.principal}</Badge>}
                    {vendedor.plano_van > 0 && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Van: {vendedor.plano_van}</Badge>}
                    {vendedor.plano_moto > 0 && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Moto: {vendedor.plano_moto}</Badge>}
                    {vendedor.plano_caminhao > 0 && <Badge variant="outline" className="text-[10px] h-5 px-1.5">Cam: {vendedor.plano_caminhao}</Badge>}
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 flex-shrink-0">{vendedor.total}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}