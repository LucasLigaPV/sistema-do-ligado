import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function ResumoIndicacoes({ indicacoes }) {
  const getStats = () => {
    const total = indicacoes.length;
    const pendentes = indicacoes.filter((i) => i.status === "pendente").length;
    const aprovadas = indicacoes.filter((i) => i.status === "aprovada").length;
    const pagas = indicacoes.filter((i) => i.status === "paga").length;
    const rejeitadas = indicacoes.filter((i) => i.status === "rejeitada").length;
    
    // Valor total
    const valorTotal = indicacoes
      .filter((i) => i.status === "paga")
      .reduce((sum, i) => {
        const valor = i.valor_indicacao?.replace("R$ ", "").replace(",", ".") || "0";
        return sum + parseFloat(valor);
      }, 0);

    // Indicações este mês
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const esteMes = indicacoes.filter(
      (i) => new Date(i.created_date) >= inicioMes
    ).length;

    // Mês anterior para comparação
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const mesAnterior = indicacoes.filter((i) => {
      const data = new Date(i.created_date);
      return data >= mesPassado && data <= fimMesPassado;
    }).length;

    const crescimento = mesAnterior > 0 
      ? ((esteMes - mesAnterior) / mesAnterior * 100).toFixed(1)
      : 0;

    return {
      total,
      pendentes,
      aprovadas,
      pagas,
      rejeitadas,
      valorTotal,
      esteMes,
      crescimento,
    };
  };

  const stats = getStats();

  const cards = [
    {
      title: "Total de Indicações",
      value: stats.total,
      icon: Users,
      color: "bg-slate-50 border-slate-200",
      iconColor: "text-slate-600",
      trend: null,
    },
    {
      title: "Indicações Este Mês",
      value: stats.esteMes,
      icon: TrendingUp,
      color: "bg-[#FFF9E6] border-[#EFC200]",
      iconColor: "text-[#EFC200]",
      trend: stats.crescimento,
    },
    {
      title: "Aguardando Aprovação",
      value: stats.pendentes,
      icon: Clock,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      trend: null,
    },
    {
      title: "Aprovadas",
      value: stats.aprovadas,
      icon: CheckCircle,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      trend: null,
    },
    {
      title: "Pagas",
      value: stats.pagas,
      icon: DollarSign,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
      trend: null,
    },
    {
      title: "Valor Total Pago",
      value: `R$ ${stats.valorTotal.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-2 ${card.color} shadow-md hover:shadow-lg transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  {card.trend !== null && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      parseFloat(card.trend) >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {parseFloat(card.trend) >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(card.trend)}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}