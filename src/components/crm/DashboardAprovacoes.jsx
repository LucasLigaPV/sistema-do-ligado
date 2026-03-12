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
  // Padrão: mês vigente, filtrado por data de envio para aprovação (data_conferencia)
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

  // Filtrar negociações que passaram pelo fluxo de aprovação no período
  const negociacoesAnalise = negociacoes.filter(n => {
    if (!n.informacoes_conferidas) return false;
    const passouPorAprovacao = (
      n.etapa === "enviado_cadastro" ||
      n.status_aprovacao === "reprovado" ||
      n.status_aprovacao === "corrigido" ||
      n.status_aprovacao === "aprovado" ||
      n.status_aprovacao === "analisando"
    );
    if (!passouPorAprovacao) return false;
    
    // Determinar data para filtro: aguardando usa data_conferencia, analisando+ usa data_analise, aprovado usa data_aprovacao
    let dataParaFiltrar;
    if (n.status_aprovacao === "aguardando") {
      dataParaFiltrar = n.data_conferencia;
    } else if (n.status_aprovacao === "aprovado") {
      dataParaFiltrar = n.data_aprovacao || n.data_analise || n.data_conferencia;
    } else {
      // analisando, reprovado, corrigido
      dataParaFiltrar = n.data_analise || n.data_conferencia;
    }
    
    const data = dataParaFiltrar ? new Date(dataParaFiltrar) : new Date(n.created_date);
    return (
      data >= new Date(startDate) &&
      data <= new Date(endDate + "T23:59:59")
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

  // Taxa de aprovação - conta cada motivo de reprova como 1 reprova
  const totalReprovasHistorico = negociacoesAnalise.reduce((acc, n) => {
    if (!n.historico_reprovas || n.historico_reprovas.length === 0) return acc;
    
    const qtdMotivos = n.historico_reprovas.reduce((sum, reprova) => {
      const motivosCount = reprova.motivos?.length || 0;
      return sum + motivosCount;
    }, 0);
    
    return acc + qtdMotivos;
  }, 0);
  
  const totalAvaliadas = totalReprovasHistorico + aprovados;
  const taxaAprovacao = totalAvaliadas > 0 ? ((aprovados / totalAvaliadas) * 100).toFixed(1) : 0;

  // Motivos de reprova com detalhes — usando histórico_reprovas e motivos_reprova
  const reprovacoes = negociacoesAnalise.filter(n => n.status_aprovacao === "reprovado" || (n.historico_reprovas && n.historico_reprovas.length > 0));
  const motivosData = {};
  const motivosDetalhes = {};

  reprovacoes.forEach(r => {
    // Usa o array motivos_reprova (novo) ou fallback para campos legados
    const motivosList = r.motivos_reprova && r.motivos_reprova.length > 0
      ? r.motivos_reprova
      : r.motivo_reprova_categoria
        ? [{ categoria: r.motivo_reprova_categoria, detalhe: r.motivo_reprova_detalhe || "Sem detalhe" }]
        : [];

    motivosList.forEach(({ categoria, detalhe }) => {
      const cat = categoria || "não especificado";
      const det = detalhe || "Sem detalhe";
      motivosData[cat] = (motivosData[cat] || 0) + 1;
      if (!motivosDetalhes[cat]) motivosDetalhes[cat] = {};
      motivosDetalhes[cat][det] = (motivosDetalhes[cat][det] || 0) + 1;
    });
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

  // Performance por consultor - conta cada motivo como 1 reprova
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
    }
    
    // Contar cada motivo de reprova como 1 reprova
    if (n.historico_reprovas && n.historico_reprovas.length > 0) {
      n.historico_reprovas.forEach(reprova => {
        if (reprova.motivos && reprova.motivos.length > 0) {
          performanceData[vendedor].reprovados += reprova.motivos.length;
          
          reprova.motivos.forEach(({ categoria }) => {
            const cat = categoria || "não especificado";
            performanceData[vendedor].motivos[cat] = (performanceData[vendedor].motivos[cat] || 0) + 1;
          });
        }
      });
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
                <span className="text-sm text-slate-600">{totalReprovasHistorico} reprovas totais</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivos de Reprova */}
      {motivosChartData.length > 0 && (
        <Card className="border-0 bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold">Reprovas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {motivosChartData.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-2">{item.name}</p>
                  <p className="text-2xl font-bold text-slate-900">{item.value}</p>
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
        <CardContent className="pt-5 space-y-4">
          {[
            { label: "Aguardando Análise", value: aguardando, color: "bg-slate-300", textColor: "text-slate-500" },
            { label: "Analisando", value: analisando, color: "bg-slate-500", textColor: "text-slate-600" },
            { label: "Reprovado", value: reprovados, color: "bg-red-400", textColor: "text-red-500" },
            { label: "Corrigido", value: corrigidos, color: "bg-[#EFC200]", textColor: "text-yellow-600" },
            { label: "Aprovado", value: aprovados, color: "bg-emerald-500", textColor: "text-emerald-600" },
          ].map((item) => {
            const total = aguardando + analisando + reprovados + corrigidos + aprovados;
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${item.textColor}`}>{item.value}</span>
                    <span className="text-xs text-slate-400">{pct}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
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