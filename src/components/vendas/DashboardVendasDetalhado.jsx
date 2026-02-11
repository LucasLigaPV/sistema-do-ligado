import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calendar, 
  CreditCard, 
  Users,
  Percent,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function DashboardVendasDetalhado({ userEmail, userFuncao }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  // Filtrar vendas por período e permissões
  const vendasFiltradas = vendas.filter(v => {
    const dataVenda = new Date(v.data_venda);
    const dentroIntervalo = (!startDate || dataVenda >= new Date(startDate)) &&
                           (!endDate || dataVenda <= new Date(endDate + "T23:59:59"));
    
    if (userFuncao === "lider") {
      const equipe = equipes.find(e => e.lider_email === userEmail);
      return dentroIntervalo && equipe?.membros?.includes(v.vendedor);
    }
    if (userFuncao === "vendedor") {
      return dentroIntervalo && v.vendedor === userEmail;
    }
    return dentroIntervalo;
  });

  // Métricas Principais
  const totalVendas = vendasFiltradas.length;
  
  const totalAdesao = vendasFiltradas.reduce((sum, v) => {
    const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
    return sum + valor;
  }, 0);

  const ticketMedio = totalVendas > 0 ? totalAdesao / totalVendas : 0;

  // Análise por Plano
  const vendasPorPlano = vendasFiltradas.reduce((acc, v) => {
    acc[v.plano_vendido] = (acc[v.plano_vendido] || 0) + 1;
    return acc;
  }, {});

  const planoEssencial = vendasPorPlano["essencial"] || 0;
  const planoPrincipal = vendasPorPlano["principal"] || 0;
  const percentualEssencial = totalVendas > 0 ? ((planoEssencial / totalVendas) * 100).toFixed(1) : 0;
  const percentualPrincipal = totalVendas > 0 ? ((planoPrincipal / totalVendas) * 100).toFixed(1) : 0;

  // Análise por Forma de Pagamento
  const vendasPorPagamento = vendasFiltradas.reduce((acc, v) => {
    acc[v.forma_pagamento] = (acc[v.forma_pagamento] || 0) + 1;
    return acc;
  }, {});

  const vendasPix = vendasPorPagamento["pix"] || 0;
  const vendasCredito = vendasPorPagamento["credito"] || 0;
  const percentualPix = totalVendas > 0 ? ((vendasPix / totalVendas) * 100).toFixed(1) : 0;
  const percentualCredito = totalVendas > 0 ? ((vendasCredito / totalVendas) * 100).toFixed(1) : 0;

  // Análise por Canal
  const vendasPorCanal = vendasFiltradas.reduce((acc, v) => {
    acc[v.canal_venda] = (acc[v.canal_venda] || 0) + 1;
    return acc;
  }, {});

  const vendasLead = vendasPorCanal["lead"] || 0;
  const vendasIndicacao = vendasPorCanal["indicacao"] || 0;
  const vendasTroca = vendasPorCanal["troca_veiculo"] || 0;

  // Total de Indicações
  const totalIndicacoes = vendasFiltradas.filter(v => v.tem_indicacao === "sim").length;
  const percentualComIndicacao = totalVendas > 0 ? ((totalIndicacoes / totalVendas) * 100).toFixed(1) : 0;

  // Análise Temporal
  const vendasPorDia = vendasFiltradas.reduce((acc, v) => {
    const dia = format(new Date(v.data_venda), "yyyy-MM-dd");
    acc[dia] = (acc[dia] || 0) + 1;
    return acc;
  }, {});

  const diasComVendas = Object.keys(vendasPorDia).length;
  const mediaVendasPorDia = diasComVendas > 0 ? (totalVendas / diasComVendas).toFixed(1) : 0;

  // Ranking de Vendedores
  const vendedoresStats = {};
  vendasFiltradas.forEach(v => {
    if (!vendedoresStats[v.vendedor]) {
      vendedoresStats[v.vendedor] = {
        email: v.vendedor,
        vendas: 0,
        valorTotal: 0,
        vendasEssencial: 0,
        vendasPrincipal: 0,
        comIndicacao: 0
      };
    }
    vendedoresStats[v.vendedor].vendas++;
    const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
    vendedoresStats[v.vendedor].valorTotal += valor;
    
    if (v.plano_vendido === "essencial") vendedoresStats[v.vendedor].vendasEssencial++;
    if (v.plano_vendido === "principal") vendedoresStats[v.vendedor].vendasPrincipal++;
    if (v.tem_indicacao === "sim") vendedoresStats[v.vendedor].comIndicacao++;
  });

  const rankingVendedores = Object.values(vendedoresStats)
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, 10);

  const getNomeUsuario = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  // Vendas Recentes
  const vendasRecentes = [...vendasFiltradas]
    .sort((a, b) => new Date(b.data_venda) - new Date(a.data_venda))
    .slice(0, 10);

  // Comparação com período anterior
  const diasPeriodo = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
  const dataInicioAnterior = format(new Date(new Date(startDate).getTime() - diasPeriodo * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const dataFimAnterior = format(new Date(new Date(startDate).getTime() - 1 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  const vendasPeriodoAnterior = vendas.filter(v => {
    const dataVenda = new Date(v.data_venda);
    return dataVenda >= new Date(dataInicioAnterior) && dataVenda <= new Date(dataFimAnterior);
  }).length;

  const variacaoVendas = vendasPeriodoAnterior > 0 
    ? (((totalVendas - vendasPeriodoAnterior) / vendasPeriodoAnterior) * 100).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard de Vendas - Análise Completa</h2>
      </div>

      {/* Filtro de Período */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalVendas}</div>
            <div className="flex items-center gap-1 mt-1">
              {parseFloat(variacaoVendas) >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs ${parseFloat(variacaoVendas) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variacaoVendas}% vs período anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              R$ {formatarValor(totalAdesao)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Em adesões</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              R$ {formatarValor(ticketMedio)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Por venda</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Média Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{mediaVendasPorDia}</div>
            <p className="text-xs text-slate-500 mt-1">Vendas por dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Plano e Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Plano Essencial</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {planoEssencial} vendas
                  </Badge>
                  <span className="text-sm font-bold text-slate-900">{percentualEssencial}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${percentualEssencial}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Plano Principal</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {planoPrincipal} vendas
                  </Badge>
                  <span className="text-sm font-bold text-slate-900">{percentualPrincipal}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${percentualPrincipal}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">PIX</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {vendasPix} vendas
                  </Badge>
                  <span className="text-sm font-bold text-slate-900">{percentualPix}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${percentualPix}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Crédito</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {vendasCredito} vendas
                  </Badge>
                  <span className="text-sm font-bold text-slate-900">{percentualCredito}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-orange-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${percentualCredito}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canais e Indicações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Canal: Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{vendasLead}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalVendas > 0 ? ((vendasLead / totalVendas) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Canal: Indicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{vendasIndicacao}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalVendas > 0 ? ((vendasIndicacao / totalVendas) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Canal: Troca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{vendasTroca}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalVendas > 0 ? ((vendasTroca / totalVendas) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Indicações */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#EFC200]" />
            Vendas com Indicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-slate-900">{totalIndicacoes}</div>
              <p className="text-sm text-slate-600 mt-1">
                {percentualComIndicacao}% das vendas geraram indicação
              </p>
            </div>
            <div className="w-20 h-20 bg-[#EFC200]/10 rounded-full flex items-center justify-center">
              <Percent className="w-10 h-10 text-[#EFC200]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ranking de Vendedores */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#EFC200]" />
            Ranking de Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700">Posição</TableHead>
                <TableHead className="text-slate-700">Vendedor</TableHead>
                <TableHead className="text-center text-slate-700">Vendas</TableHead>
                <TableHead className="text-center text-slate-700">Essencial</TableHead>
                <TableHead className="text-center text-slate-700">Principal</TableHead>
                <TableHead className="text-center text-slate-700">Com Indicação</TableHead>
                <TableHead className="text-right text-slate-700">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingVendedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    Nenhuma venda no período
                  </TableCell>
                </TableRow>
              ) : (
                rankingVendedores.map((v, index) => (
                  <TableRow key={v.email} className="border-slate-100">
                    <TableCell className="font-semibold">
                      {index === 0 && <span className="text-[#EFC200]">🥇</span>}
                      {index === 1 && <span className="text-slate-400">🥈</span>}
                      {index === 2 && <span className="text-amber-700">🥉</span>}
                      {index > 2 && <span className="text-slate-600">{index + 1}º</span>}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {getNomeUsuario(v.email)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-slate-900 text-white">
                        {v.vendas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {v.vendasEssencial}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {v.vendasPrincipal}
                    </TableCell>
                    <TableCell className="text-center text-slate-700">
                      {v.comIndicacao}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      R$ {formatarValor(v.valorTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendas Recentes */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Últimas Vendas Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700">Data</TableHead>
                <TableHead className="text-slate-700">Cliente</TableHead>
                <TableHead className="text-slate-700">Plano</TableHead>
                <TableHead className="text-slate-700">Forma Pagto</TableHead>
                <TableHead className="text-slate-700">Canal</TableHead>
                <TableHead className="text-right text-slate-700">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasRecentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Nenhuma venda registrada
                  </TableCell>
                </TableRow>
              ) : (
                vendasRecentes.map((venda) => (
                  <TableRow key={venda.id} className="border-slate-100">
                    <TableCell className="text-slate-700">
                      {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {venda.cliente}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        venda.plano_vendido === "essencial" 
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }>
                        {venda.plano_vendido}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        venda.forma_pagamento === "pix"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-orange-50 text-orange-700 border-orange-200"
                      }>
                        {venda.forma_pagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-slate-700">
                      {venda.canal_venda?.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      R$ {formatarValor(venda.valor_adesao)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}