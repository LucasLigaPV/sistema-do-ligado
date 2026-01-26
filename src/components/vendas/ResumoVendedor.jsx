import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Package, Target, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const PLANO_CARREIRA = [
  { vendas: 0, nivel: "Nível 1", comissaoPorPlaca: 30, percentualAdesao: 0, recorrencia: 0 },
  { vendas: 20, nivel: "Nível 2", comissaoPorPlaca: 30, percentualAdesao: 0, recorrencia: 0 },
  { vendas: 25, nivel: "Nível 3", comissaoPorPlaca: 0, percentualAdesao: 50, recorrencia: 4 },
  { vendas: 40, nivel: "Nível 4", comissaoPorPlaca: 0, percentualAdesao: 100, recorrencia: 6 },
  { vendas: 50, nivel: "Nível 5", comissaoPorPlaca: 0, percentualAdesao: 100, recorrencia: 8 },
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
      return totalVendas * nivelAtual.comissaoPorPlaca;
    } else {
      return (totalAdesao * nivelAtual.percentualAdesao) / 100;
    }
  };

  const comissaoValor = calcularComissao();
  const percentualRecorrencia = nivelAtual.recorrencia;

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
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                <Award className="w-7 h-7 text-slate-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Plano de Carreira</p>
                <h3 className="text-2xl font-bold text-slate-900">{nivelAtual.nivel}</h3>
                <p className="text-slate-600 text-sm mt-1">
                  {nivelAtual.comissaoPorPlaca > 0 
                    ? `R$ ${nivelAtual.comissaoPorPlaca} por placa`
                    : `${nivelAtual.percentualAdesao}% sobre adesão + ${nivelAtual.recorrencia}% recorrência`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-sm mb-1">Vendas Realizadas</p>
              <p className="text-4xl font-bold text-slate-900">{totalVendas}</p>
            </div>
          </div>
          
          {proximoNivel && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between text-slate-700 text-sm mb-3">
                <span className="font-medium">Próximo nível: {proximoNivel.nivel}</span>
                <span className="text-slate-500">{totalVendas}/{proximoNivel.vendas} vendas</span>
              </div>
              <Progress value={progresso} className="h-2.5 bg-slate-200" />
              <p className="text-slate-500 text-xs mt-2">
                Faltam {proximoNivel.vendas - totalVendas} vendas para alcançar o próximo nível
              </p>
            </div>
          )}
          {!proximoNivel && (
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <p className="text-emerald-700 text-sm font-medium">🎉 Parabéns! Você alcançou o nível máximo!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Comissão */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Comissão</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Comissão sobre Adesão</p>
                  <p className="text-3xl font-bold text-[#EFC200]">
                    R$ {comissaoValor.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {nivelAtual.comissaoPorPlaca > 0 
                      ? `R$ ${nivelAtual.comissaoPorPlaca} por placa`
                      : `${nivelAtual.percentualAdesao}% sobre adesão`
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#FFF9E6] rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#EFC200]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Recorrência</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {percentualRecorrencia}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Percentual de recorrência mensal
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards de Relatório Geral */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Relatório Geral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-3xl font-bold text-slate-900">
                    R$ {totalAdesao.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-slate-600" />
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
        </div>
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