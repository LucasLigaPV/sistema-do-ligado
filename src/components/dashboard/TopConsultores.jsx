import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function TopConsultores({ indicacoes }) {
  const getConsultoresStats = () => {
    const consultoresCounts = {};

    indicacoes.forEach((ind) => {
      const consultor = ind.consultor_responsavel;
      if (!consultoresCounts[consultor]) {
        consultoresCounts[consultor] = {
          nome: consultor,
          total: 0,
          pendentes: 0,
          aprovadas: 0,
          pagas: 0,
          rejeitadas: 0,
        };
      }
      consultoresCounts[consultor].total++;
      consultoresCounts[consultor][ind.status]++;
    });

    return Object.values(consultoresCounts).sort((a, b) => b.total - a.total);
  };

  const consultoresStats = getConsultoresStats();

  // Dados para o gráfico (top 8)
  const chartData = consultoresStats.slice(0, 8).map((c) => ({
    nome: c.nome.split(" ")[0], // Apenas primeiro nome
    total: c.total,
  }));

  const colors = ["#EFC200", "#D4A900", "#F5D84A", "#C49700", "#EFC200", "#D4A900", "#F5D84A", "#C49700"];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#D4A900] to-[#EFC200] text-black">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-6 h-6" />
          Consultores - Indicações Recebidas
        </CardTitle>
        <p className="text-sm text-black/80 mt-1">
          Ranking de consultores por número de indicações
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {consultoresStats.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma indicação registrada ainda</p>
          </div>
        ) : (
          <>
            {/* Gráfico */}
            <div className="mb-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lista detalhada */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {consultoresStats.map((consultor, index) => (
                <motion.div
                  key={consultor.nome}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EFC200] text-black font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{consultor.nome}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {consultor.pendentes > 0 && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {consultor.pendentes} pendente{consultor.pendentes > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {consultor.aprovadas > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {consultor.aprovadas} aprovada{consultor.aprovadas > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {consultor.pagas > 0 && (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {consultor.pagas} paga{consultor.pagas > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-[#EFC200] text-black font-bold text-base px-4 py-1">
                      {consultor.total}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}