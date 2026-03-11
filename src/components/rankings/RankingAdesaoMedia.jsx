import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingAdesaoMedia({ vendas, users }) {
  // Filtrar vendas sem trocas (troca_titularidade, troca_veiculo, segundo_veiculo)
  const vendasSemTrocas = vendas.filter(v => 
    !['troca_titularidade', 'troca_veiculo', 'segundo_veiculo'].includes(v.canal_venda)
  );

  const ranking = {};

  vendasSemTrocas.forEach(venda => {
    const email = venda.email_vendedor;
    if (!ranking[email]) {
      ranking[email] = { total: 0, somaAdesao: 0, media: 0 };
    }
    ranking[email].total++;
    
    // Converter valor de adesão para número
    const valorAdesao = parseFloat(venda.valor_adesao?.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    ranking[email].somaAdesao += valorAdesao;
  });

  // Calcular média
  Object.keys(ranking).forEach(email => {
    const { total, somaAdesao } = ranking[email];
    ranking[email].media = total > 0 ? somaAdesao / total : 0;
  });

  const rankingArray = Object.entries(ranking)
    .filter(([_, dados]) => dados.total > 0)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, ...dados };
    })
    .sort((a, b) => b.media - a.media)
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
          <DollarSign className="w-5 h-5 text-slate-600" />
          Adesão Média (Sem Trocas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma venda encontrada</p>
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
                    {vendedor.total} {vendedor.total === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                R$ {vendedor.media.toFixed(2)}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}