import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Package, Target, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const PLANO_CARREIRA = [
  { vendas: 0, nivel: "Iniciante", comissaoPorPlaca: 30, percentualAdesao: 0, recorrencia: 0 },
  { vendas: 20, nivel: "Bronze", comissaoPorPlaca: 30, percentualAdesao: 0, recorrencia: 0 },
  { vendas: 25, nivel: "Prata", comissaoPorPlaca: 0, percentualAdesao: 50, recorrencia: 4 },
  { vendas: 40, nivel: "Ouro", comissaoPorPlaca: 0, percentualAdesao: 100, recorrencia: 6 },
  { vendas: 50, nivel: "Diamante", comissaoPorPlaca: 0, percentualAdesao: 100, recorrencia: 8 },
];

const CORES_CANAIS = {
  lead: "#3b82f6",
  indicacao: "#10b981",
  troca_veiculo: "#f59e0b",
};

export default function ResumoVendedor({ userEmail }) {
  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ["vendas", userEmail],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });

  const vendasDoVendedor = vendas.filter(v => v.vendedor === userEmail);

  // Calcular estatísticas
  const totalVendas = vendasDoVendedor.length;
  const totalAdesao = vendasDoVendedor.reduce((sum, v) => {
    const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
    return sum + valor;
  }, 0);

  // Plano mais vendido
  const planoCount = vendasDoVendedor.reduce((acc, v) => {
    acc[v.plano_vendido] = (acc[v.plano_vendido] || 0) + 1;
    return acc;
  }, {});
  const planoMaisVendido = Object.keys(planoCount).length > 0
    ? Object.entries(planoCount).sort((a, b) => b[1] - a[1])[0][0]
    : "-";

  // Canais de venda
  const canaisData = vendasDoVendedor.reduce((acc, v) => {
    const canal = v.canal_venda || "outros";
    acc[canal] = (acc[canal] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(canaisData).map(([canal, count]) => ({
    name: canal === "lead" ? "Lead" : canal === "indicacao" ? "Indicação" : canal === "troca_veiculo" ? "Troca Veículo" : canal,
    value: count,
    percentage: ((count / totalVendas) * 100).toFixed(1),
  }));

  const canalPrincipal = chartData.length > 0
    ? chartData.sort((a, b) => b.value - a.value)[0]
    : null;

  // Calcular nível do plano de carreira
  const getNivelAtual = () => {
    for (let i = PLANO_CARREIRA.length - 1; i >= 0; i--) {
      if (totalVendas >= PLANO_CARREIRA[i].vendas) {
        return PLANO_CARREIRA[i];
      }
    }
    return PLANO_CARREIRA[0];
  };

  const getProximoNivel = () => {
    const nivelAtual = getNivelAtual();
    const indexAtual = PLANO_CARREIRA.findIndex(n => n.vendas === nivelAtual.vendas);
    return indexAtual < PLANO_CARREIRA.length - 1 ? PLANO_CARREIRA[indexAtual + 1] : null;
  };

  const nivelAtual = getNivelAtual();
  const proximoNivel = getProximoNivel();

  // Calcular progresso
  const calcularProgresso = () => {
    if (!proximoNivel) return 100;
    const vendasNoNivel = totalVendas - nivelAtual.vendas;
    const vendasParaProximo = proximoNivel.vendas - nivelAtual.vendas;
    return (vendasNoNivel / vendasParaProximo) * 100;
  };

  const progresso = calcularProgresso();

  // Calcular comissão
  const calcularComissao = () => {
    if (nivelAtual.comissaoPorPlaca > 0) {
      return {
        tipo: "Por Placa",
        valor: totalVendas * nivelAtual.comissaoPorPlaca,
        descricao: `R$ ${nivelAtual.comissaoPorPlaca} por placa`
      };
    } else {
      const comissaoAdesao = (totalAdesao * nivelAtual.percentualAdesao) / 100;
      return {
        tipo: "Adesão + Recorrência",
        valor: comissaoAdesao,
        descricao: `${nivelAtual.percentualAdesao}% da adesão + ${nivelAtual.recorrencia}% de recorrência`
      };
    }
  };

  const comissao = calcularComissao();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plano de Carreira */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#EFC200] to-[#D4A900]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{nivelAtual.nivel}</h3>
                <p className="text-white/80 text-sm">{comissao.descricao}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Vendas Realizadas</p>
              <p className="text-3xl font-bold text-white">{totalVendas}</p>
            </div>
          </div>
          
          {proximoNivel && (
            <div>
              <div className="flex justify-between text-white/90 text-sm mb-2">
                <span>Próximo nível: {proximoNivel.nivel}</span>
                <span>{totalVendas}/{proximoNivel.vendas} vendas</span>
              </div>
              <Progress value={progresso} className="h-3 bg-white/20" />
              <p className="text-white/70 text-xs mt-2">
                Faltam {proximoNivel.vendas - totalVendas} vendas para o próximo nível
              </p>
            </div>
          )}
          {!proximoNivel && (
            <div className="text-center">
              <p className="text-white text-sm">🎉 Você alcançou o nível máximo!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Vendas</p>
                <p className="text-3xl font-bold text-slate-900">{totalVendas}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Adesão</p>
                <p className="text-3xl font-bold text-emerald-600">
                  R$ {totalAdesao.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Plano Mais Vendido</p>
                <p className="text-3xl font-bold text-slate-900 capitalize">
                  {planoMaisVendido}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Comissão {comissao.tipo}</p>
                <p className="text-3xl font-bold text-[#EFC200]">
                  R$ {comissao.valor.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#FFF9E6] rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-[#EFC200]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Canais de Venda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Canais de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => {
                      const canal = entry.name.toLowerCase().replace(" ", "_");
                      const cor = CORES_CANAIS[canal] || "#94a3b8";
                      return <Cell key={`cell-${index}`} fill={cor} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Canal Principal</CardTitle>
          </CardHeader>
          <CardContent>
            {canalPrincipal ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#EFC200] to-[#D4A900] rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 capitalize mb-2">
                    {canalPrincipal.name}
                  </h3>
                  <p className="text-slate-500">
                    {canalPrincipal.value} vendas ({canalPrincipal.percentage}%)
                  </p>
                </div>

                <div className="space-y-3">
                  {chartData.map((canal, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-slate-700">{canal.name}</span>
                        <span className="text-slate-500">{canal.percentage}%</span>
                      </div>
                      <Progress 
                        value={parseFloat(canal.percentage)} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}