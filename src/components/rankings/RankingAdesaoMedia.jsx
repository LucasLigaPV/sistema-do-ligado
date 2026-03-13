import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Trophy, Award, Medal } from "lucide-react";
import { motion } from "framer-motion";

const getNomeVendedor = (email, users) => {
  if (!email) return "N/A";
  const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    return user.nome_exibicao || user.full_name || email;
  }
  return email;
};

export default function RankingAdesaoMedia({ vendas, users }) {
  // Filtrar vendas sem trocas (troca_titularidade, troca_veiculo, segundo_veiculo)
  const vendasSemTrocas = vendas.filter(v => 
    !['troca_titularidade', 'troca_veiculo', 'segundo_veiculo'].includes(v.canal_venda)
  );

  const ranking = {};

  // Inicializar todos os vendedores com 0
  users.forEach(user => {
    if (user.funcao === "vendedor" || user.funcao === "lider") {
      ranking[user.email] = { total: 0, somaAdesao: 0, media: 0 };
    }
  });

  vendasSemTrocas.forEach(venda => {
    const email = venda.email_vendedor;
    if (ranking[email]) {
      ranking[email].total++;
      
      // Converter valor de adesão para número
      const valorAdesao = parseFloat(venda.valor_adesao?.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      ranking[email].somaAdesao += valorAdesao;
    }
  });

  // Calcular média
  Object.keys(ranking).forEach(email => {
    const { total, somaAdesao } = ranking[email];
    ranking[email].media = total > 0 ? somaAdesao / total : 0;
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      return { email, nome: getNomeVendedor(email, users), ...dados };
    })
    .sort((a, b) => b.media - a.media);

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
          <DollarSign className="w-4 h-4 text-slate-600" />
          <span>Adesão Média</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto space-y-2">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-sm">Nenhuma venda</p>
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
                  <p className="text-[10px] text-slate-500">{vendedor.total} {vendedor.total === 1 ? 'venda' : 'vendas'}</p>
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 flex-shrink-0">
                R$ {vendedor.media.toFixed(0)}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}