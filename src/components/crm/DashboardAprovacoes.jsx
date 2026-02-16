import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

export default function DashboardAprovacoes() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Filtrar negociações em análise no período
  const negociacoesAnalise = negociacoes.filter(n => {
    const dataConf = n.data_conferencia ? new Date(n.data_conferencia) : new Date(n.created_date);
    return (
      n.informacoes_conferidas &&
      n.etapa === "enviado_cadastro" &&
      dataConf >= new Date(startDate) &&
      dataConf <= new Date(endDate + "T23:59:59")
    );
  });

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  // Estatísticas gerais
  const aguardando = negociacoesAnalise.filter(n => n.status_aprovacao === "aguardando").length;
  const analisando = negociacoesAnalise.filter(n => n.status_aprovacao === "analisando").length;
  const reprovados = negociacoesAnalise.filter(n => n.status_aprovacao === "reprovado").length;
  const corrigidos = negociacoesAnalise.filter(n => n.status_aprovacao === "corrigido").length;
  const aprovados = negociacoesAnalise.filter(n => n.status_aprovacao === "aprovado").length;

  // Taxa de aprovação
  const totalAvaliadas = reprovados + corrigidos + aprovados;
  const taxaAprovacao = totalAvaliadas > 0 ? ((aprovados / totalAvaliadas) * 100).toFixed(1) : 0;

  // Motivos de reprova
  const reprovacoes = negociacoesAnalise.filter(n => n.status_aprovacao === "reprovado");
  const motivosData = {};
  reprovacoes.forEach(r => {
    const categoria = r.motivo_reprova_categoria || "não especificado";
    motivosData[categoria] = (motivosData[categoria] || 0) + 1;
  });

  const motivosChartData = Object.entries(motivosData).map(([categoria, count]) => ({
    name: categoria === "documentacao" ? "Documentação" :
          categoria === "contrato" ? "Contrato" :
          categoria === "vistoria_fotos" ? "Vistoria - Fotos" :
          categoria === "vistoria_videos" ? "Vistoria - Vídeos" :
          "Preenchimento",
    value: count,
  }));

  // Performance por consultor
  const performanceData = {};
  negociacoesAnalise.forEach(n => {
    const vendedor = getNomeVendedor(n.vendedor_email);
    if (!performanceData[vendedor]) {
      performanceData[vendedor] = { enviados: 0, aprovados: 0, reprovados: 0, taxa: 0 };
    }
    performanceData[vendedor].enviados++;
    if (n.status_aprovacao === "aprovado") {
      performanceData[vendedor].aprovados++;
    } else if (n.status_aprovacao === "reprovado") {
      performanceData[vendedor].reprovados++;
    }
  });

  Object.keys(performanceData).forEach(vendedor => {
    const data = performanceData[vendedor];
    data.taxa = data.enviados > 0 ? ((data.aprovados / data.enviados) * 100).toFixed(0) : 0;
  });

  const performanceArray = Object.entries(performanceData).map(([vendedor, data]) => ({
    vendedor,
    ...data,
  }));

  const cores = ["#EFC200", "#10B981", "#EF4444", "#3B82F6", "#8B5CF6"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard de Aprovações</h2>
        <p className="text-slate-600">Insights e análise de performance</p>
      </div>

      {/* Filtro de Data */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Período</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label className="text-xs text-slate-600 mb-1 block">De</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-slate-600 mb-1 block">Até</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Aguardando</p>
            <p className="text-2xl font-bold text-amber-600">{aguardando}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Analisando</p>
            <p className="text-2xl font-bold text-blue-600">{analisando}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Reprovados</p>
            <p className="text-2xl font-bold text-red-600">{reprovados}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Corrigidos</p>
            <p className="text-2xl font-bold text-green-600">{corrigidos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Aprovados</p>
            <p className="text-2xl font-bold text-emerald-600">{aprovados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Aprovação */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Taxa de Aprovação</p>
              <p className="text-4xl font-bold text-slate-900">{taxaAprovacao}%</p>
              <p className="text-xs text-slate-500 mt-2">De {totalAvaliadas} vendas analisadas</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-emerald-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{aprovados} aprovadas</span>
              </div>
              <div className="flex items-center justify-end gap-1 text-red-600">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-semibold">{reprovados} reprovadas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Motivos de Reprova */}
        {motivosChartData.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Motivos de Reprova</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={motivosChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {motivosChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status da Fila */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm">Status da Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[{ 
                name: "Vendas", 
                aguardando, 
                analisando, 
                reprovado: reprovados,
                corrigido: corrigidos,
                aprovado: aprovados 
              }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aguardando" fill="#F59E0B" />
                <Bar dataKey="analisando" fill="#3B82F6" />
                <Bar dataKey="reprovado" fill="#EF4444" />
                <Bar dataKey="corrigido" fill="#10B981" />
                <Bar dataKey="aprovado" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Consultor */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-sm">Performance por Consultor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceArray.map((perf, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900">{perf.vendedor}</p>
                  <p className="text-xs text-slate-500">{perf.enviados} enviadas</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Aprovados</p>
                    <p className="text-sm font-semibold text-emerald-600">{perf.aprovados}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Reprovados</p>
                    <p className="text-sm font-semibold text-red-600">{perf.reprovados}</p>
                  </div>
                  <Badge className={perf.taxa >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                    {perf.taxa}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}