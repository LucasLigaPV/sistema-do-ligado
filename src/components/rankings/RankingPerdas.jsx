import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingPerdas({ perdas, users }) {
  // Filtrar perdas excluindo lead_invalido
  const perdasValidas = perdas.filter(p => p.categoria_motivo !== 'lead_invalido');
  const ranking = {};

  // Inicializar todos os vendedores com 0
  users.forEach(user => {
    if (user.funcao === "vendedor" || user.funcao === "lider") {
      ranking[user.email] = {
        total: 0,
        financeiro: 0,
        timing: 0,
        confianca: 0,
        concorrencia: 0,
        necessidade: 0,
        situacoes_esporadicas: 0
      };
    }
  });

  perdasValidas.forEach(perda => {
    const email = perda.vendedor_email;
    if (ranking[email]) {
      ranking[email].total++;
      if (perda.categoria_motivo) ranking[email][perda.categoria_motivo]++;
    }
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, ...dados };
    })
    .sort((a, b) => b.total - a.total);

  const getCategoriaLabel = (cat) => {
    const labels = {
      financeiro: "Financeiro",
      timing: "Timing",
      confianca: "Confiança",
      concorrencia: "Concorrência",
      necessidade: "Necessidade",
      situacoes_esporadicas: "Esporádicas",
      lead_invalido: "Lead Inválido"
    };
    return labels[cat] || cat;
  };

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4 text-slate-600" />
          <span>Perdas por Motivo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto space-y-2">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-sm">Nenhuma perda</p>
          ) : rankingArray.map((vendedor, index) => (
            <motion.div
              key={vendedor.email}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-2.5 rounded-lg border bg-white border-slate-200 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-sm text-slate-900 truncate">{vendedor.nome}</p>
                </div>
                <div className="text-xl font-bold text-slate-900">{vendedor.total}</div>
              </div>
              <div className="flex gap-1.5 flex-wrap ml-8">
                {vendedor.financeiro > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-red-50 text-red-700 border-red-200">Fin: {vendedor.financeiro}</Badge>}
                {vendedor.timing > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-yellow-50 text-yellow-700 border-yellow-200">Tim: {vendedor.timing}</Badge>}
                {vendedor.confianca > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-orange-50 text-orange-700 border-orange-200">Conf: {vendedor.confianca}</Badge>}
                {vendedor.concorrencia > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-purple-50 text-purple-700 border-purple-200">Conc: {vendedor.concorrencia}</Badge>}
                {vendedor.necessidade > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200">Nec: {vendedor.necessidade}</Badge>}
                {vendedor.situacoes_esporadicas > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-teal-50 text-teal-700 border-teal-200">Esp: {vendedor.situacoes_esporadicas}</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}