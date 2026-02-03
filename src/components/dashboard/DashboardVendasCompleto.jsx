import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Clock,
  Award,
  Calendar,
  Percent,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Timer,
  PieChart,
  Zap
} from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardVendasCompleto({ userEmail, userFuncao }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list(),
  });

  const { data: negociacoes = [], isLoading: loadingNegociacoes } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  // Filtrar dados por período
  const vendasFiltradas = vendas.filter(v => {
    const dataVenda = new Date(v.data_venda);
    return dataVenda >= new Date(startDate) && dataVenda <= new Date(endDate + "T23:59:59");
  });

  // Aplicar filtro de acesso
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail && e.ativa);
  const membrosEquipe = minhaEquipe ? minhaEquipe.membros : [];
  const todosVendedoresEquipe = minhaEquipe ? [minhaEquipe.lider_email, ...membrosEquipe] : [userEmail];

  let vendasVisiveis = vendasFiltradas;
  let negociacoesVisiveis = negociacoes;

  if (userFuncao === "lider") {
    vendasVisiveis = vendasFiltradas.filter(v => todosVendedoresEquipe.includes(v.vendedor));
    negociacoesVisiveis = negociacoes.filter(n => todosVendedoresEquipe.includes(n.vendedor_email));
  } else if (userFuncao === "vendedor") {
    vendasVisiveis = vendasFiltradas.filter(v => v.vendedor === userEmail);
    negociacoesVisiveis = negociacoes.filter(n => n.vendedor_email === userEmail);
  }

  // Cálculos gerais
  const totalVendas = vendasVisiveis.length;
  const totalAdesao = vendasVisiveis.reduce((sum, v) => {
    const valor = parseFloat(v.valor_adesao?.replace(/[^\d,]/g, "").replace(",", ".") || 0);
    return sum + valor;
  }, 0);

  const totalMensalidade = vendasVisiveis.reduce((sum, v) => {
    const valor = parseFloat(v.valor_adesao?.replace(/[^\d,]/g, "").replace(",", ".") || 0);
    return sum + valor;
  }, 0) / (vendasVisiveis.length || 1); // Média mensal

  const vendasPorPlano = vendasVisiveis.reduce((acc, v) => {
    acc[v.plano_vendido] = (acc[v.plano_vendido] || 0) + 1;
    return acc;
  }, {});

  const vendasPorCanal = vendasVisiveis.reduce((acc, v) => {
    acc[v.canal_venda] = (acc[v.canal_venda] || 0) + 1;
    return acc;
  }, {});

  const vendasComIndicacao = vendasVisiveis.filter(v => v.tem_indicacao === "sim").length;
  const percentualIndicacao = totalVendas > 0 ? ((vendasComIndicacao / totalVendas) * 100).toFixed(1) : 0;

  // Taxa de conversão
  const negociacoesAtivas = negociacoesVisiveis.filter(n => n.etapa === "venda_ativa").length;
  const taxaConversao = negociacoesVisiveis.length > 0 
    ? ((negociacoesAtivas / negociacoesVisiveis.length) * 100).toFixed(1)
    : 0;

  // Tempo médio de conversão
  const temposMedios = vendasVisiveis.map(v => {
    const negociacao = negociacoes.find(n => n.vendedor_email === v.vendedor && n.nome_cliente === v.cliente);
    if (negociacao && negociacao.data_entrada) {
      const inicio = parseISO(negociacao.data_entrada);
      const fim = parseISO(v.data_venda);
      return differenceInDays(fim, inicio);
    }
    return 0;
  }).filter(t => t > 0);

  const tempoMedioConversao = temposMedios.length > 0
    ? (temposMedios.reduce((a, b) => a + b, 0) / temposMedios.length).toFixed(1)
    : 0;

  // Ranking de vendedores
  const rankingVendedores = Object.entries(
    vendasVisiveis.reduce((acc, v) => {
      acc[v.vendedor] = (acc[v.vendedor] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([email, count]) => {
      const user = users.find(u => u.email === email);
      const vendasVendedor = vendasVisiveis.filter(v => v.vendedor === email);
      const totalAdesaoVendedor = vendasVendedor.reduce((sum, v) => {
        const valor = parseFloat(v.valor_adesao?.replace(/[^\d,]/g, "").replace(",", ".") || 0);
        return sum + valor;
      }, 0);
      
      return {
        email,
        nome: user?.full_name || email,
        vendas: count,
        totalAdesao: totalAdesaoVendedor,
      };
    })
    .sort((a, b) => b.vendas - a.vendas);

  // Dados para gráfico de vendas por dia
  const vendasPorDia = vendasVisiveis.reduce((acc, v) => {
    const dia = format(new Date(v.data_venda), "dd/MM");
    acc[dia] = (acc[dia] || 0) + 1;
    return acc;
  }, {});

  const dadosGraficoVendas = Object.entries(vendasPorDia).map(([dia, count]) => ({
    dia,
    vendas: count,
  }));

  // Dados para gráfico de pizza - planos
  const dadosPlanos = Object.entries(vendasPorPlano).map(([plano, count]) => ({
    name: plano === "essencial" ? "Essencial" : "Principal",
    value: count,
  }));

  // Dados para gráfico de pizza - canais
  const dadosCanais = Object.entries(vendasPorCanal).map(([canal, count]) => ({
    name: canal === "lead" ? "Lead" : canal === "indicacao" ? "Indicação" : "Troca de Veículo",
    value: count,
  }));

  // Etapas do funil
  const etapas = [
    "novo_lead",
    "abordagem",
    "sondagem",
    "apresentacao",
    "cotacao",
    "em_negociacao",
    "vistoria_assinatura_pix",
    "enviado_cadastro",
    "venda_ativa"
  ];

  const dadosFunil = etapas.map(etapa => ({
    etapa: etapa.replace(/_/g, " ").toUpperCase(),
    quantidade: negociacoesVisiveis.filter(n => n.etapa === etapa).length,
  }));

  const COLORS = ["#EFC200", "#D4A900", "#FFA500", "#FF8C00", "#FF6B35"];

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  if (loadingVendas || loadingNegociacoes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalVendas}</div>
            <p className="text-xs text-slate-500 mt-1">Vendas concluídas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#EFC200]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Adesão Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#EFC200]">
              R$ {totalAdesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Receita de adesões</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Mensalidade Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              R$ {totalMensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Receita recorrente média</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{taxaConversao}%</div>
            <p className="text-xs text-slate-500 mt-1">Negociações → Vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Tempo Médio de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{tempoMedioConversao} dias</div>
            <p className="text-xs text-slate-500 mt-1">Do primeiro contato à venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Vendas com Indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{vendasComIndicacao}</div>
            <Badge className="mt-2 bg-green-100 text-green-800">{percentualIndicacao}% do total</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              R$ {(totalAdesao / (totalVendas || 1)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Por venda realizada</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList className="bg-white shadow-md p-1.5 rounded-xl h-14">
          <TabsTrigger value="ranking" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11">
            <Award className="w-4 h-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="graficos" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11">
            <BarChart3 className="w-4 h-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="funil" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11">
            <PieChart className="w-4 h-4" />
            Funil de Vendas
          </TabsTrigger>
        </TabsList>

        {/* Ranking de Vendedores */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#EFC200]" />
                Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingVendedores.map((vendedor, index) => (
                  <div
                    key={vendedor.email}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? "bg-yellow-400 text-yellow-900" :
                        index === 1 ? "bg-slate-300 text-slate-700" :
                        index === 2 ? "bg-orange-400 text-orange-900" :
                        "bg-slate-200 text-slate-600"
                      }`}>
                        {index + 1}º
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{vendedor.nome}</p>
                        <p className="text-sm text-slate-500">{vendedor.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#EFC200]">{vendedor.vendas}</p>
                      <p className="text-xs text-slate-500">
                        R$ {vendedor.totalAdesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráficos */}
        <TabsContent value="graficos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGraficoVendas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="vendas" fill="#EFC200" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={dadosPlanos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosPlanos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={dadosCanais}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosCanais.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Plano Essencial</span>
                  <span className="font-bold">{vendasPorPlano.essencial || 0} vendas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Plano Principal</span>
                  <span className="font-bold">{vendasPorPlano.principal || 0} vendas</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-sm text-slate-600">Canal Lead</span>
                  <span className="font-bold">{vendasPorCanal.lead || 0} vendas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Canal Indicação</span>
                  <span className="font-bold">{vendasPorCanal.indicacao || 0} vendas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Troca de Veículo</span>
                  <span className="font-bold">{vendasPorCanal.troca_veiculo || 0} vendas</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funil de Vendas */}
        <TabsContent value="funil">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dadosFunil} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="etapa" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#EFC200" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Insights do Funil</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Taxa de conversão geral: <strong>{taxaConversao}%</strong></li>
                  <li>• Tempo médio até venda: <strong>{tempoMedioConversao} dias</strong></li>
                  <li>• Maior gargalo: <strong>{dadosFunil.reduce((max, item) => item.quantidade > max.quantidade ? item : max).etapa}</strong></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}