import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, Eye, XCircle } from "lucide-react";

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

  // Motivos de reprova com detalhes
  const reprovacoes = negociacoesAnalise.filter(n => n.status_aprovacao === "reprovado");
  const motivosData = {};
  const motivosDetalhes = {};

  reprovacoes.forEach(r => {
    const categoria = r.motivo_reprova_categoria || "não especificado";
    const detalhe = r.motivo_reprova_detalhe || "Sem detalhe";
    
    motivosData[categoria] = (motivosData[categoria] || 0) + 1;
    
    if (!motivosDetalhes[categoria]) {
      motivosDetalhes[categoria] = {};
    }
    motivosDetalhes[categoria][detalhe] = (motivosDetalhes[categoria][detalhe] || 0) + 1;
  });

  const categoriasMotivo = {
    documentacao: "Documentação",
    contrato: "Contrato",
    vistoria_fotos: "Vistoria - Fotos",
    vistoria_videos: "Vistoria - Vídeos",
    preenchimento: "Preenchimento",
  };

  const motivosChartData = Object.entries(motivosData).map(([categoria, count]) => ({
    name: categoriasMotivo[categoria] || categoria,
    value: count,
    id: categoria,
  })).sort((a, b) => b.value - a.value);

  // Performance por consultor
  const performanceData = {};
  const consultoresReprovacoes = {};

  negociacoesAnalise.forEach(n => {
    const vendedor = getNomeVendedor(n.vendedor_email);
    if (!performanceData[vendedor]) {
      performanceData[vendedor] = { enviados: 0, aprovados: 0, reprovados: 0, corrigidos: 0, taxa: 0, motivos: {} };
    }
    performanceData[vendedor].enviados++;
    if (n.status_aprovacao === "aprovado") {
      performanceData[vendedor].aprovados++;
    } else if (n.status_aprovacao === "reprovado") {
      performanceData[vendedor].reprovados++;
      const motivo = n.motivo_reprova_categoria || "não especificado";
      performanceData[vendedor].motivos[motivo] = (performanceData[vendedor].motivos[motivo] || 0) + 1;
    } else if (n.status_aprovacao === "corrigido") {
      performanceData[vendedor].corrigidos++;
    }
  });

  Object.keys(performanceData).forEach(vendedor => {
    const data = performanceData[vendedor];
    data.taxa = data.enviados > 0 ? ((data.aprovados / data.enviados) * 100).toFixed(0) : 0;
  });

  const performanceArray = Object.entries(performanceData)
    .map(([vendedor, data]) => ({
      vendedor,
      ...data,
    }))
    .sort((a, b) => b.reprovados - a.reprovados);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard de Aprovações</h2>
        <p className="text-slate-600">Análise e performance do processo de aprovação</p>
      </div>

      {/* Filtro de Data */}
      <Card className="border-0 bg-white">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Período</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 pt-4">
          <div className="flex-1">
            <Label className="text-xs text-slate-600 mb-2 block font-medium">De</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-slate-600 mb-2 block font-medium">Até</Label>
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
        <Card className="border-0 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-600">Aguardando</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{aguardando}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-600">Analisando</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{analisando}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-600">Reprovados</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{reprovados}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-600">Corrigidos</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{corrigidos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-600">Aprovados</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{aprovados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de Aprovação */}
      <Card className="border-0 bg-white">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Taxa de Aprovação</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-slate-900">{taxaAprovacao}%</p>
              <p className="text-xs text-slate-500 mt-2">De {totalAvaliadas} analisadas</p>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-slate-600">{aprovados} aprovadas</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-slate-600">{reprovados} reprovadas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivos de Reprova - Detalhado */}
      {motivosChartData.length > 0 && (
        <Card className="border-0 bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Análise Detalhada de Reprovas</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {motivosChartData.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">{item.value} reprova{item.value > 1 ? 's' : ''}</Badge>
                  </div>
                  
                  {motivosDetalhes[item.id] && Object.entries(motivosDetalhes[item.id]).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(motivosDetalhes[item.id])
                        .sort((a, b) => b[1] - a[1])
                        .map(([detalhe, count]) => (
                          <div key={detalhe} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                            <span className="text-slate-700">{detalhe}</span>
                            <Badge variant="outline" className="text-xs">{count}x</Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status da Fila */}
      <Card className="border-0 bg-white">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold">Status da Fila</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[{ 
              name: "Vendas", 
              aguardando, 
              analisando, 
              reprovado: reprovados,
              corrigido: corrigidos,
              aprovado: aprovados 
            }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="aguardando" fill="#94a3b8" />
              <Bar dataKey="analisando" fill="#64748b" />
              <Bar dataKey="reprovado" fill="#dc2626" />
              <Bar dataKey="corrigido" fill="#f59e0b" />
              <Bar dataKey="aprovado" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance e Ranking por Motivos de Reprova */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance por Consultor */}
        <Card className="border-0 bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Performance por Consultor</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {performanceArray.map((perf, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-slate-900">{perf.vendedor}</p>
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">{perf.taxa}%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Enviadas</p>
                      <p className="font-semibold text-slate-900">{perf.enviados}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Aprovadas</p>
                      <p className="font-semibold text-slate-900">{perf.aprovados}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Reprovadas</p>
                      <p className="font-semibold text-slate-900">{perf.reprovados}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ranking por Motivos de Reprova */}
        <Card className="border-0 bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Top Consultores por Reprova</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {performanceArray
                .filter(p => p.reprovados > 0)
                .slice(0, 5)
                .map((perf, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-slate-900">#{idx + 1} - {perf.vendedor}</p>
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">{perf.reprovados} reprova{perf.reprovados > 1 ? 's' : ''}</Badge>
                    </div>
                    
                    {Object.entries(perf.motivos).length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(perf.motivos)
                          .sort((a, b) => b[1] - a[1])
                          .map(([motivo, count]) => (
                            <div key={motivo} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded">
                              <span className="text-slate-700">{categoriasMotivo[motivo] || motivo}</span>
                              <span className="font-medium text-slate-900">{count}x</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}