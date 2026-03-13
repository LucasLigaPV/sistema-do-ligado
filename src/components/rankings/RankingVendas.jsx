import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingVendas({ vendas, users }) {
  const ranking = {};

  // Inicializar todos os vendedores com 0
  users.forEach(user => {
    if (user.role === "vendedor" || user.role === "lider") {
      ranking[user.email] = {
        total: 0,
        essencial: 0,
        principal: 0,
        plano_van: 0,
        plano_moto: 0,
        plano_caminhao: 0
      };
    }
  });

  vendas.forEach(venda => {
    const email = venda.email_vendedor;
    // Inicializar se não existir
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
    .filter(([email, dados]) => dados.total > 0)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      const nome = user?.full_name || email.split('@')[0];
      return { email, nome, ...dados };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const getMedalIcon = (index) => {
    if (index === 0) return <div className="w-7 h-7 rounded-full bg-[#EFC200] text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm">1</div>;
    if (index === 1) return <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm">2</div>;
    if (index === 2) return <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">3</div>;
    return <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{index + 1}</div>;
  };

  const top3 = rankingArray.slice(0, 3);
  const demais = rankingArray.slice(3);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-slate-600" />
          <span>Ranking Geral de Vendas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3 flex-1 flex flex-col">
        {/* Pódio Top 3 */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-1.5 px-2">
            {/* 2º Lugar */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 max-w-[100px]"
              >
                <div className="bg-slate-50 border border-slate-200 rounded-t-lg p-2 text-center">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-slate-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-700">2</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-900 truncate mb-1">{top3[1].nome}</p>
                  <div className="text-xl font-bold text-slate-900">{top3[1].total}</div>
                </div>
                <div className="h-12 bg-slate-200/50 border-t-2 border-slate-300 rounded-b-lg" />
              </motion.div>
            )}

            {/* 1º Lugar */}
            {top3[0] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="flex-1 max-w-[100px]"
              >
                <div className="bg-gradient-to-br from-[#FFF9E6] to-[#FFFAED] border-2 border-[#EFC200] rounded-t-lg p-2 text-center shadow-sm">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-[#EFC200] flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-slate-900" />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-900 truncate mb-1">{top3[0].nome}</p>
                  <div className="text-xl font-bold text-slate-900">{top3[0].total}</div>
                </div>
                <div className="h-20 bg-[#EFC200]/20 border-t-2 border-[#EFC200] rounded-b-lg" />
              </motion.div>
            )}

            {/* 3º Lugar */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 max-w-[100px]"
              >
                <div className="bg-slate-50 border border-slate-200 rounded-t-lg p-2 text-center">
                  <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-600">3</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-900 truncate mb-1">{top3[2].nome}</p>
                  <div className="text-xl font-bold text-slate-900">{top3[2].total}</div>
                </div>
                <div className="h-8 bg-slate-100/50 border-t-2 border-slate-200 rounded-b-lg" />
              </motion.div>
            )}
          </div>
        )}

        {/* Demais posições */}
        {demais.length > 0 && (
          <div className="flex-1 flex flex-col gap-1.5 pt-2 border-t border-slate-100 overflow-auto">
            {demais.map((vendedor, index) => (
              <motion.div
                key={vendedor.email}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.03 }}
                className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                  {index + 4}
                </div>
                <p className="font-medium text-sm text-slate-900 flex-1 min-w-0 truncate">{vendedor.nome}</p>
                <div className="text-lg font-bold text-slate-900 flex-shrink-0">{vendedor.total}</div>
              </motion.div>
            ))}
          </div>
        )}

        {rankingArray.length === 0 && (
          <p className="text-slate-500 text-center py-6 text-sm">Nenhuma venda registrada</p>
        )}
      </CardContent>
    </Card>
  );
}