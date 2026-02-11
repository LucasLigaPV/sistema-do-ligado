import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal, User } from "lucide-react";
import { motion } from "framer-motion";

export default function TopIndicadores({ indicacoes }) {
  const getTopIndicadores = () => {
    const indicadoresCounts = {};
    
    indicacoes.forEach((ind) => {
      const nome = ind.nome_indicador;
      if (!indicadoresCounts[nome]) {
        indicadoresCounts[nome] = {
          nome,
          total: 0,
          aprovadas: 0,
          pagas: 0,
          email: ind.email_indicador,
          telefone: ind.telefone_indicador,
        };
      }
      indicadoresCounts[nome].total++;
      if (ind.status === "aprovada") indicadoresCounts[nome].aprovadas++;
      if (ind.status === "paga") indicadoresCounts[nome].pagas++;
    });

    return Object.values(indicadoresCounts)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const topIndicadores = getTopIndicadores();

  const getMedalIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-[#EFC200]" />;
    if (index === 1) return <Award className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#EFC200]" />
          Top 10 Indicadores
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Pessoas que mais indicaram associados
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {topIndicadores.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma indicação registrada ainda</p>
            </div>
          ) : (
            topIndicadores.map((indicador, index) => (
              <motion.div
                key={indicador.nome}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8">
                    {getMedalIcon(index) || (
                      <span className="text-lg font-bold text-slate-400">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{indicador.nome}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-slate-500">{indicador.email}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{indicador.telefone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{indicador.total}</div>
                    <div className="flex gap-1 mt-1 justify-end flex-wrap">
                      {indicador.pagas > 0 && (
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          {indicador.pagas} paga{indicador.pagas > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {indicador.aprovadas > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {indicador.aprovadas} aprovada{indicador.aprovadas > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}