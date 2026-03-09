import React, { useState } from "react";
import { useUsuarios } from "../shared/useUsuarios";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Users, DollarSign, Target, AlertTriangle, Award, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import FiltroVendedor from "../shared/FiltroVendedor";

export default function DashboardCRM({ userEmail, userFuncao }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedVendedores, setSelectedVendedores] = useState([]);

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: perdas = [] } = useQuery({
    queryKey: ["perdas"],
    queryFn: () => base44.entities.Perda.list(),
  });

  const { usuarios: users } = useUsuarios();

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  // Filtrar por vendedor selecionado (master/lider)
  const negociacoesFiltradas = negociacoes.filter(n => {
    const dataEntrada = new Date(n.data_entrada || n.created_date);
    const dentroIntervalo = (!startDate || dataEntrada >= new Date(startDate)) &&
                           (!endDate || dataEntrada <= new Date(endDate + "T23:59:59"));
    
    const equipe = equipes.find(e => e.lider_email === userEmail);
    const membrosFiltro = [userEmail, ...(equipe?.membros || [])];
    const passaVendedor = selectedVendedores.length > 0 ? selectedVendedores.includes(n.vendedor_email) : true;
    
    if (userFuncao === "master") return dentroIntervalo && passaVendedor;
    if (userFuncao === "lider") return dentroIntervalo && membrosFiltro.includes(n.vendedor_email) && passaVendedor;
    if (userFuncao === "vendedor") return dentroIntervalo && n.vendedor_email === userEmail;
    return dentroIntervalo;
  });

  const perdasFiltradas = perdas.filter(p => {
    const dataPerda = new Date(p.data_perda);
    const dentroIntervalo = (!startDate || dataPerda >= new Date(startDate)) &&
                           (!endDate || dataPerda <= new Date(endDate + "T23:59:59"));
    const equipe = equipes.find(e => e.lider_email === userEmail);
    const membrosFiltro = [userEmail, ...(equipe?.membros || [])];
    const passaVendedor = selectedVendedor !== "todos" ? p.vendedor_email === selectedVendedor : true;
    
    if (userFuncao === "master") return dentroIntervalo && passaVendedor;
    if (userFuncao === "lider") return dentroIntervalo && membrosFiltro.includes(p.vendedor_email) && passaVendedor;
    if (userFuncao === "vendedor") return dentroIntervalo && p.vendedor_email === userEmail;
    return dentroIntervalo;
  });

  // Vendedores disponíveis para filtro
  const vendedoresParaFiltro = (userFuncao === "master" || userFuncao === "lider")
    ? users.filter(u => {
        if (userFuncao === "master") return u.funcao === "vendedor" || u.funcao === "lider";
        const equipe = equipes.find(e => e.lider_email === userEmail);
        return u.email === userEmail || equipe?.membros?.includes(u.email);
      })
    : [];

  // Etapas do pipeline
  const etapas = [
    { key: "novo_lead", label: "Novo Lead" },
    { key: "abordagem", label: "Abordagem" },
    { key: "sondagem", label: "Sondagem" },
    { key: "apresentacao", label: "Apresentação" },
    { key: "cotacao", label: "Cotação" },
    { key: "em_negociacao", label: "Em Negociação" },
    { key: "vistoria_assinatura_pix", label: "Vistoria/Assinatura/Pix" },
    { key: "enviado_cadastro", label: "Enviado Cadastro" },
    { key: "venda_ativa", label: "Venda Ativa" }
  ];

  // Métricas gerais
  const totalNegociacoes = negociacoesFiltradas.length;
  const vendasAtivas = negociacoesFiltradas.filter(n => n.etapa === "venda_ativa").length;
  const totalPerdas = perdasFiltradas.length;
  const taxaConversao = totalNegociacoes > 0 ? ((vendasAtivas / totalNegociacoes) * 100).toFixed(1) : 0;
  const taxaPerda = totalNegociacoes > 0 ? ((totalPerdas / (totalNegociacoes + totalPerdas)) * 100).toFixed(1) : 0;

  // Valores financeiros
  const valorAdesaoTotal = negociacoesFiltradas
    .filter(n => n.etapa === "venda_ativa" && n.valor_adesao)
    .reduce((acc, n) => acc + parseFloat(n.valor_adesao.replace(/[^\d,]/g, "").replace(",", ".") || 0), 0);

  const valorMensalidadeTotal = negociacoesFiltradas
    .filter(n => n.etapa === "venda_ativa" && n.valor_mensalidade)
    .reduce((acc, n) => acc + parseFloat(n.valor_mensalidade.replace(/[^\d,]/g, "").replace(",", ".") || 0), 0);

  const ticketMedioAdesao = vendasAtivas > 0 ? (valorAdesaoTotal / vendasAtivas) : 0;
  const mediaMensalVendida = vendasAtivas > 0 ? (valorMensalidadeTotal / vendasAtivas) : 0;

  // Ranking de vendedores
  const vendedoresStats = {};
  negociacoesFiltradas.forEach(n => {
    if (!vendedoresStats[n.vendedor_email]) {
      vendedoresStats[n.vendedor_email] = {
        email: n.vendedor_email,
        totalNegociacoes: 0,
        vendas: 0,
        perdas: 0,
        valorAdesao: 0,
        valorMensalidade: 0
      };
    }
    vendedoresStats[n.vendedor_email].totalNegociacoes++;
    if (n.etapa === "venda_ativa") {
      vendedoresStats[n.vendedor_email].vendas++;
      if (n.valor_adesao) {
        vendedoresStats[n.vendedor_email].valorAdesao += parseFloat(n.valor_adesao.replace(/[^\d,]/g, "").replace(",", ".") || 0);
      }
      if (n.valor_mensalidade) {
        vendedoresStats[n.vendedor_email].valorMensalidade += parseFloat(n.valor_mensalidade.replace(/[^\d,]/g, "").replace(",", ".") || 0);
      }
    }
  });

  perdasFiltradas.forEach(p => {
    if (vendedoresStats[p.vendedor_email]) {
      vendedoresStats[p.vendedor_email].perdas++;
    }
  });

  const rankingVendedores = Object.values(vendedoresStats)
    .map(v => ({
      ...v,
      taxaConversao: v.totalNegociacoes > 0 ? ((v.vendas / v.totalNegociacoes) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.vendas - a.vendas);

  // Quantidade por etapa
  const quantidadePorEtapa = etapas.map(etapa => ({
    ...etapa,
    quantidade: negociacoesFiltradas.filter(n => n.etapa === etapa.key).length
  }));

  // Motivos de perda
  const motivosPerda = {};
  perdasFiltradas.forEach(p => {
    const chave = `${p.categoria_motivo}|${p.motivo_perda}`;
    if (!motivosPerda[chave]) {
      motivosPerda[chave] = {
        categoria: p.categoria_motivo,
        motivo: p.motivo_perda,
        quantidade: 0
      };
    }
    motivosPerda[chave].quantidade++;
  });

  const motivosOrdenados = Object.values(motivosPerda).sort((a, b) => b.quantidade - a.quantidade);

  const getNomeUsuario = (email) => {
    if (!email) return "-";
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    return user?.nome_exibicao || user?.full_name || email;
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      financeiro: "Financeiro",
      timing: "Timing",
      confianca: "Confiança",
      concorrencia: "Concorrência",
      necessidade: "Necessidade",
      lead_invalido: "Lead Inválido"
    };
    return labels[categoria] || categoria;
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Período:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
              />
              <span className="text-slate-500">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm"
              />
            </div>
            {vendedoresParaFiltro.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-slate-700">Vendedor:</Label>
                <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                  <SelectTrigger className="w-48 h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {vendedoresParaFiltro.map(u => (
                      <SelectItem key={u.email} value={u.email}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Negociações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalNegociacoes}</div>
            <p className="text-xs text-slate-500 mt-1">Total em andamento</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{taxaConversao}%</div>
            <p className="text-xs text-slate-500 mt-1">{vendasAtivas} vendas ativas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Taxa de Perda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-700">{taxaPerda}%</div>
            <p className="text-xs text-slate-500 mt-1">{totalPerdas} leads perdidos</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              R$ {ticketMedioAdesao.toFixed(0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Adesão média</p>
          </CardContent>
        </Card>
      </div>

      {/* Valores Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <DollarSign className="w-5 h-5" />
              Valor Total em Adesões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900">
              R$ {valorAdesaoTotal.toFixed(2).replace(".", ",")}
            </div>
            <p className="text-sm text-slate-600 mt-2">
              De {vendasAtivas} vendas ativas no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUp className="w-5 h-5" />
              Média Mensal Vendida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-900">
              R$ {mediaMensalVendida.toFixed(2).replace(".", ",")}
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Média por venda ativa no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Vendedores */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#EFC200]" />
            Ranking de Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700">Posição</TableHead>
                <TableHead className="text-slate-700">Vendedor</TableHead>
                <TableHead className="text-center text-slate-700">Negociações</TableHead>
                <TableHead className="text-center text-slate-700">Vendas</TableHead>
                <TableHead className="text-center text-slate-700">Perdas</TableHead>
                <TableHead className="text-center text-slate-700">Taxa Conv.</TableHead>
                <TableHead className="text-right text-slate-700">Valor Adesão</TableHead>
                <TableHead className="text-right text-slate-700">Média Mensal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingVendedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    Nenhum dado disponível no período
                  </TableCell>
                </TableRow>
              ) : (
                rankingVendedores.map((vendedor, index) => (
                  <TableRow key={vendedor.email} className="border-slate-100">
                    <TableCell className="font-semibold">
                      {index === 0 && <span className="text-[#EFC200]">🥇</span>}
                      {index === 1 && <span className="text-slate-400">🥈</span>}
                      {index === 2 && <span className="text-amber-700">🥉</span>}
                      {index > 2 && <span className="text-slate-600">{index + 1}º</span>}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {getNomeUsuario(vendedor.email)}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {vendedor.totalNegociacoes}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {vendedor.vendas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                        {vendedor.perdas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-900">
                      {vendedor.taxaConversao}%
                    </TableCell>
                    <TableCell className="text-right text-slate-900">
                      R$ {vendedor.valorAdesao.toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell className="text-right text-slate-900">
                     {vendedor.vendas > 0
                       ? `R$ ${(vendedor.valorMensalidade / vendedor.vendas).toFixed(2).replace(".", ",")}`
                       : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Funil de Vendas */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Funil de Vendas - Leads por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quantidadePorEtapa.map((etapa, index) => {
              const porcentagem = totalNegociacoes > 0 
                ? ((etapa.quantidade / totalNegociacoes) * 100).toFixed(1)
                : 0;
              
              return (
                <div key={etapa.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{etapa.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">{etapa.quantidade} leads</span>
                      <span className="text-slate-500 text-xs w-12 text-right">{porcentagem}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        etapa.key === "venda_ativa" 
                          ? "bg-green-600" 
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Perdas */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Motivos de Perda - Análise Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700">Categoria</TableHead>
                <TableHead className="text-slate-700">Motivo</TableHead>
                <TableHead className="text-center text-slate-700">Quantidade</TableHead>
                <TableHead className="text-center text-slate-700">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motivosOrdenados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    Nenhuma perda registrada no período
                  </TableCell>
                </TableRow>
              ) : (
                motivosOrdenados.map((motivo, index) => {
                  const porcentagem = totalPerdas > 0 
                    ? ((motivo.quantidade / totalPerdas) * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <TableRow key={index} className="border-slate-100">
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                          {getCategoriaLabel(motivo.categoria)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900">{motivo.motivo}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-900">
                        {motivo.quantidade}
                      </TableCell>
                      <TableCell className="text-center text-slate-700">
                        {porcentagem}%
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insights Estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Tempo Médio no Funil</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const vendasFechadas = negociacoesFiltradas.filter(n => n.etapa === "venda_ativa");
              if (vendasFechadas.length === 0) {
                return (
                  <>
                    <div className="text-2xl font-bold text-slate-900">-</div>
                    <p className="text-xs text-slate-600 mt-1">Nenhuma venda finalizada</p>
                  </>
                );
              }

              const temposEmMs = vendasFechadas.map(v => {
                const dataInicio = new Date(v.data_entrada || v.created_date);
                const dataFim = new Date(v.updated_date);
                return dataFim - dataInicio;
              });

              const tempoMedioMs = temposEmMs.reduce((a, b) => a + b, 0) / temposEmMs.length;
              const dias = Math.floor(tempoMedioMs / (1000 * 60 * 60 * 24));
              const horas = Math.floor((tempoMedioMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

              return (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {dias}d {horas}h
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Média para fechamento ({vendasFechadas.length} vendas)</p>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Gargalo Identificado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">
              {quantidadePorEtapa.sort((a, b) => b.quantidade - a.quantidade)[0]?.label || "-"}
            </div>
            <p className="text-xs text-slate-600 mt-1">Etapa com mais leads acumulados</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Principal Motivo de Perda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">
              {motivosOrdenados[0]?.motivo || "Nenhuma perda"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {motivosOrdenados[0] ? `${((motivosOrdenados[0].quantidade / totalPerdas) * 100).toFixed(0)}% das perdas` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}