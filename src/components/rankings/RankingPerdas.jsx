import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingPerdas({ perdas, users }) {
  const ranking = {};

  perdas.forEach(perda => {
    const email = perda.vendedor_email;
    if (!ranking[email]) {
      ranking[email] = {
        total: 0,
        financeiro: 0,
        timing: 0,
        confianca: 0,
        concorrencia: 0,
        necessidade: 0,
        situacoes_esporadicas: 0,
        lead_invalido: 0
      };
    }
    ranking[email].total++;
    if (perda.categoria_motivo) ranking[email][perda.categoria_motivo]++;
  });

  const rankingArray = Object.entries(ranking)
    .map(([email, dados]) => {
      const user = users.find(u => u.email === email);
      return { email, nome: user?.full_name || email, ...dados };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

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
    <Card className="border-slate-200 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-slate-600" />
          Perdas por Motivo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-3">
          {rankingArray.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma perda encontrada</p>
          ) : rankingArray.map((vendedor, index) => (
            <motion.div
              key={vendedor.email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border bg-white border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-slate-900">{vendedor.nome}</p>
                </div>
                <div className="text-2xl font-bold text-slate-900">{vendedor.total}</div>
              </div>
              <div className="flex gap-2 flex-wrap ml-12">
                {vendedor.financeiro > 0 && <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Financeiro: {vendedor.financeiro}</Badge>}
                {vendedor.concorrencia > 0 && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">Concorrência: {vendedor.concorrencia}</Badge>}
                {vendedor.timing > 0 && <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Timing: {vendedor.timing}</Badge>}
                {vendedor.confianca > 0 && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Confiança: {vendedor.confianca}</Badge>}
                {vendedor.lead_invalido > 0 && <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">Lead Inválido: {vendedor.lead_invalido}</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}