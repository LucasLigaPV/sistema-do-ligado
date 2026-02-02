import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Package, Target, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";

const PLANO_CARREIRA = [
  { vendas: 0, nivel: "Nível 1", comissaoPorPlaca: 0, percentualAdesao: 0, recorrencia: 0 },
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

const formatarValor = (valor) => {
  const numero = typeof valor === 'string' 
    ? parseFloat(valor.replace(/[^0-9,]/g, "").replace(",", ".")) 
    : valor;
  
  if (isNaN(numero)) return "0,00";
  
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function ResumoVendedor({ userEmail, userFuncao }) {
  const [vendedorSelecionado, setVendedorSelecionado] = React.useState(userEmail);

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser", userEmail],
    queryFn: async () => {
      const user = await base44.auth.me();
      return user;
    },
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.filter({ ativa: true }),
    enabled: userFuncao === "lider",
  });

  // Obter equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail);
  const membrosEquipe = minhaEquipe ? [userEmail, ...(minhaEquipe.membros || [])] : [];

  const { data: users = [] } = useQuery({
    queryKey: ["users", membrosEquipe],
    queryFn: async () => {
      if (!membrosEquipe.length) return [];
      try {
        const usuarioPromises = membrosEquipe.map(email =>
          base44.entities.User.filter({ email }).then(result => result[0] || null)
        );
        const results = await Promise.all(usuarioPromises);
        return results.filter(Boolean);
      } catch {
        return [];
      }
    },
    enabled: userFuncao === "lider" && membrosEquipe.length > 0,
  });

  const vendasDoVendedor = vendas.filter(v => v.vendedor === vendedorSelecionado && v.etapa === "ativo");

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
  
  const [progressoAnimado, setProgressoAnimado] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setProgressoAnimado(progresso);
    }, 100);
    return () => clearTimeout(timer);
  }, [progresso]);

  // Comemorar novo nível alcançado
  React.useEffect(() => {
    if (!currentUser || totalVendas === 0) return;

    const nivelAtualIndex = PLANO_CARREIRA.findIndex(n => n.nivel === nivelAtual.nivel);
    const ultimoNivelComemorado = currentUser.ultimo_nivel_comemorado || 0;

    if (nivelAtualIndex > ultimoNivelComemorado && nivelAtualIndex > 0) {
      // Disparar confetes
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#EFC200', '#D4A900', '#F5D84A'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#EFC200', '#D4A900', '#F5D84A'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Atualizar último nível comemorado
      base44.auth.updateMe({ ultimo_nivel_comemorado: nivelAtualIndex });
    }
  }, [currentUser, totalVendas, nivelAtual]);

  // Calcular total de indicações
  const totalIndicacoes = vendasDoVendedor.reduce((sum, v) => {
    if (v.tem_indicacao === "sim" && v.valor_indicacao) {
      const valor = parseFloat(v.valor_indicacao.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      return sum + valor;
    }
    return sum;
  }, 0);

  // Calcular comissão bruta
  const calcularComissaoBruta = () => {
    if (nivelAtual.comissaoPorPlaca > 0) {
      return totalVendas * nivelAtual.comissaoPorPlaca;
    } else {
      return (totalAdesao * nivelAtual.percentualAdesao) / 100;
    }
  };

  const comissaoBruta = calcularComissaoBruta();
  const comissaoAposIndicacao = comissaoBruta - totalIndicacoes;
  const taxas = comissaoAposIndicacao * 0.04;
  const comissaoLiquida = comissaoAposIndicacao - taxas;
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
      <h2 className="text-2xl font-bold text-slate-900">Resumo</h2>

      {userFuncao === "lider" && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <Label className="text-sm text-slate-600 mb-3 block">Selecione o Vendedor</Label>
            <Select value={vendedorSelecionado} onValueChange={setVendedorSelecionado}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione um vendedor">
                  {users.find(u => u.email === vendedorSelecionado)?.full_name || vendedorSelecionado}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {membrosEquipe.map((email) => {
                   const user = users.find(u => u.email === email);
                   return (
                     <SelectItem key={email} value={email}>
                       {user?.full_name || email} {email === userEmail ? "(Você)" : ""}
                     </SelectItem>
                   );
                 })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

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
                  {nivelAtual.nivel === "Nível 1" 
                    ? "Sem comissão neste nível"
                    : nivelAtual.comissaoPorPlaca > 0 
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

          {/* Barra de Progressão Visual com Todos os Níveis */}
          <div className="space-y-4">
            <div className="relative">
              {/* Linha de fundo */}
              <div className="absolute top-6 left-0 right-0 h-2 bg-slate-200 rounded-full" />

              {/* Barra de progresso preenchida */}
              <div 
                className="absolute top-6 left-0 h-2 bg-gradient-to-r from-[#EFC200] to-[#D4A900] rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min((totalVendas / PLANO_CARREIRA[PLANO_CARREIRA.length - 1].vendas) * 100, 100)}%` 
                }}
              />

              {/* Marcadores dos níveis */}
              <div className="relative flex justify-between">
                {PLANO_CARREIRA.map((nivel, index) => {
                  const isAtingido = totalVendas >= nivel.vendas;
                  const isAtual = nivelAtual.nivel === nivel.nivel;

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                          isAtingido 
                            ? 'bg-gradient-to-br from-[#EFC200] to-[#D4A900] text-black shadow-lg scale-110' 
                            : 'bg-white border-2 border-slate-300 text-slate-400'
                        } ${isAtual ? 'ring-4 ring-[#EFC200]/30' : ''}`}
                      >
                        {index + 1}
                      </div>
                      <p className={`text-xs font-medium mt-2 ${isAtingido ? 'text-slate-900' : 'text-slate-400'}`}>
                        {nivel.nivel}
                      </p>
                      <p className={`text-xs mt-1 ${isAtingido ? 'text-slate-600' : 'text-slate-400'}`}>
                        {nivel.vendas} vendas
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {proximoNivel && (
              <div className={`rounded-lg p-4 mt-6 ${nivelAtual.nivel === "Nível 1" ? "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200" : "bg-slate-50"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Próximo nível: {proximoNivel.nivel}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Faltam {proximoNivel.vendas - totalVendas} vendas
                    </p>
                    {nivelAtual.nivel === "Nível 1" && (
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        💪 Continue assim! Chegue a 20 vendas e comece a ganhar comissões!
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{Math.round(progresso)}%</p>
                    <p className="text-xs text-slate-500">{totalVendas}/{proximoNivel.vendas}</p>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <Progress 
                    value={progressoAnimado} 
                    className="h-2.5 bg-slate-200 mt-3 transition-all duration-1000 ease-out" 
                  />
                </div>
              </div>
            )}
            {!proximoNivel && (
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4 text-center mt-6 border border-emerald-200">
                <p className="text-emerald-700 text-sm font-medium">🎉 Parabéns! Você alcançou o nível máximo!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Comissão */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Comissão</h3>
          {nivelAtual.nivel === "Nível 1" && (
            <span className="text-sm text-amber-600 font-medium">
              🎯 Alcance 20 vendas para começar a ganhar!
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Comissão Bruta</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {formatarValor(comissaoBruta)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {nivelAtual.comissaoPorPlaca > 0 
                      ? `R$ ${nivelAtual.comissaoPorPlaca} por placa`
                      : `${nivelAtual.percentualAdesao}% sobre adesão`
                    }
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
                  <p className="text-sm text-slate-500">Indicações</p>
                  <p className="text-2xl font-bold text-red-600">
                    - R$ {formatarValor(totalIndicacoes)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Comissão de indicadores
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Taxas (4%)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    - R$ {formatarValor(taxas)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Desconto sobre subtotal
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-[#EFC200] to-[#D4A900]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black/70">Comissão Líquida</p>
                  <p className="text-2xl font-bold text-black">
                    R$ {formatarValor(comissaoLiquida)}
                  </p>
                  <p className="text-xs text-black/60 mt-1">
                    Valor final a receber
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Recorrência Mensal</p>
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
                    R$ {formatarValor(totalAdesao)}
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