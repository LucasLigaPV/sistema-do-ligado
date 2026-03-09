import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, DollarSign, Package, Trophy, Target, Award, Users, Calendar, CreditCard, Percent, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import FiltroVendedor from "../shared/FiltroVendedor";

const CORES_CANAIS = {
  lead: "#3b82f6",
  indicacao: "#10b981",
  troca_veiculo: "#f59e0b",
  troca_titularidade: "#ec4899",
  segundo_veiculo: "#8b5cf6",
};

const CORES_PLANOS = {
  essencial: "#8b5cf6",
  principal: "#ec4899",
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

export default function DashboardVendas({ userEmail, userRole, userFuncao }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [dataInicio, setDataInicio] = useState(inicioMes.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(fimMes.toISOString().split('T')[0]);
  const [consultorFilter, setConsultorFilter] = useState([]);

  const { data: allVendas = [], isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.filter({ ativa: true }),
  });

  // Obter equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail);
  const membrosEquipe = minhaEquipe ? [userEmail, ...(minhaEquipe.membros || [])] : [];

  const vendas = userRole === "admin" || userFuncao === "master"
    ? allVendas 
    : userFuncao === "lider"
    ? allVendas.filter((v) => membrosEquipe.includes(v.email_vendedor || v.vendedor))
    : allVendas.filter(v => v.email_vendedor === userEmail || v.vendedor === userEmail);

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((venda) => {
      if (dataInicio && venda.data_venda) {
        const dataVenda = new Date(venda.data_venda);
        const inicio = new Date(dataInicio);
        if (dataVenda < inicio) return false;
      }
      if (dataFim && venda.data_venda) {
        const dataVenda = new Date(venda.data_venda);
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        if (dataVenda > fim) return false;
      }
      if (consultorFilter.length > 0 && !consultorFilter.includes(venda.email_vendedor)) return false;
      return true;
    });
  }, [vendas, dataInicio, dataFim, consultorFilter]);

  // Estatísticas do mês atual
  const vendasMesAtual = useMemo(() => {
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    return vendas.filter(v => {
      if (!v.data_venda) return false;
      const dataVenda = new Date(v.data_venda);
      return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
    }).length;
  }, [vendas]);

  const estatisticas = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const totalFaturamento = vendasFiltradas.reduce((sum, v) => {
      const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      return sum + valor;
    }, 0);

    const vendasAtivas = vendasFiltradas.filter(v => v.etapa === "ativo").length;
    const vendasPagamentoOk = vendasFiltradas.filter(v => v.etapa === "pagamento_ok").length;
    const vendasVistoriaOk = vendasFiltradas.filter(v => v.etapa === "vistoria_ok").length;
    const vendasEmAtivacao = vendasFiltradas.filter(v => v.etapa === "em_ativacao").length;

    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;

    const vendasComIndicacao = vendasFiltradas.filter(v => v.tem_indicacao === "sim").length;
    const percentualIndicacao = totalVendas > 0 ? (vendasComIndicacao / totalVendas) * 100 : 0;

    const vendasLead = vendasFiltradas.filter(v => v.canal_venda === "lead").length;
    const percentualLead = totalVendas > 0 ? (vendasLead / totalVendas) * 100 : 0;

    const vendasOutrosCanais = vendasFiltradas.filter(v => v.canal_venda !== "lead" && v.canal_venda !== "indicacao").length;
    const percentualOutrosCanais = totalVendas > 0 ? (vendasOutrosCanais / totalVendas) * 100 : 0;

    return { 
      totalVendas, 
      totalFaturamento, 
      vendasAtivas, 
      vendasPagamentoOk, 
      vendasVistoriaOk,
      vendasEmAtivacao,
      ticketMedio,
      vendasComIndicacao,
      percentualIndicacao,
      vendasLead,
      percentualLead,
      vendasOutrosCanais,
      percentualOutrosCanais
    };
  }, [vendasFiltradas]);

  const rankingVendedores = useMemo(() => {
    if (userFuncao !== "lider" && userFuncao !== "master" && userRole !== "admin") return [];
    
    const vendedoresMap = {};
    
    vendasFiltradas.forEach(venda => {
      const vendedorKey = venda.email_vendedor || venda.vendedor;
      if (!vendedoresMap[vendedorKey]) {
        const usuario = usuarios.find(u => u.email === vendedorKey);
        vendedoresMap[vendedorKey] = {
          nome: usuario?.nome_exibicao || usuario?.full_name || venda.vendedor || vendedorKey,
          email: vendedorKey,
          totalVendas: 0,
          totalFaturamento: 0,
          vendasAtivas: 0,
          vendasPagamentoOk: 0,
          ticketMedio: 0,
          comIndicacao: 0,
        };
      }
      
      vendedoresMap[vendedorKey].totalVendas += 1;
      const valor = parseFloat(venda.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      vendedoresMap[vendedorKey].totalFaturamento += valor;
      
      if (venda.etapa === "ativo") vendedoresMap[vendedorKey].vendasAtivas += 1;
      if (venda.etapa === "pagamento_ok") vendedoresMap[vendedorKey].vendasPagamentoOk += 1;
      if (venda.tem_indicacao === "sim") vendedoresMap[vendedorKey].comIndicacao += 1;
    });

    return Object.values(vendedoresMap)
      .map(v => ({
        ...v,
        ticketMedio: v.totalVendas > 0 ? v.totalFaturamento / v.totalVendas : 0,
        percentualIndicacao: v.totalVendas > 0 ? (v.comIndicacao / v.totalVendas) * 100 : 0
      }))
      .sort((a, b) => b.totalVendas - a.totalVendas);
  }, [vendasFiltradas, usuarios, userFuncao, userRole]);

  const dadosCanais = useMemo(() => {
    const canais = vendasFiltradas.reduce((acc, v) => {
      const canal = v.canal_venda || "outros";
      if (!acc[canal]) {
        acc[canal] = { count: 0, valor: 0 };
      }
      acc[canal].count += 1;
      const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      acc[canal].valor += valor;
      return acc;
    }, {});

    const formatarNomeCanal = (canal) => {
      const nomes = {
        lead: "Lead",
        indicacao: "Indicação",
        troca_veiculo: "Troca Veículo",
        troca_titularidade: "Troca de Titularidade",
        segundo_veiculo: "Segundo Veículo"
      };
      return nomes[canal] || canal;
    };

    return Object.entries(canais).map(([canal, data]) => ({
      name: formatarNomeCanal(canal),
      canal: canal,
      value: data.count,
      valor: data.valor,
    }));
  }, [vendasFiltradas]);

  const dadosPlanos = useMemo(() => {
    const planos = vendasFiltradas.reduce((acc, v) => {
      const plano = v.plano_vendido;
      if (!acc[plano]) {
        acc[plano] = { count: 0, valor: 0 };
      }
      acc[plano].count += 1;
      const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      acc[plano].valor += valor;
      return acc;
    }, {});

    const formatarNomePlano = (plano) => {
      const nomes = {
        essencial: "Essencial",
        principal: "Principal",
        plano_van: "Plano Van",
        plano_moto: "Plano Moto",
        plano_caminhao: "Plano Caminhão"
      };
      return nomes[plano] || plano;
    };

    return Object.entries(planos).map(([plano, data]) => ({
      name: formatarNomePlano(plano),
      plano: plano,
      value: data.count,
      valor: data.valor,
    }));
  }, [vendasFiltradas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${(userFuncao === "lider" || userFuncao === "master" || userRole === "admin") ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-4`}>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            {(userFuncao === "lider" || userFuncao === "master" || userRole === "admin") && (
              <FiltroVendedor
                vendedoresSelecionados={consultorFilter}
                todosVendedores={userFuncao === "master" || userRole === "admin" ? usuarios.filter(u => u.funcao === "lider" || u.funcao === "vendedor").map(u => u.email) : membrosEquipe}
                onSelectionChange={setConsultorFilter}
                userEmail={userEmail}
                nomesPorEmail={userFuncao === "master" || userRole === "admin" ? Object.fromEntries(usuarios.filter(u => u.funcao === "lider" || u.funcao === "vendedor").map(u => [u.email, u.nome_exibicao || u.full_name || u.email.split("@")[0]])) : (minhaEquipe?.nomes_membros || {})}
              />
            )}
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
            <div className="text-3xl font-bold text-slate-900">{estatisticas.totalVendas}</div>
            <p className="text-xs text-slate-500 mt-1">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              R$ {formatarValor(estatisticas.totalFaturamento)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Valor total gerado</p>
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
              R$ {formatarValor(estatisticas.ticketMedio)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Adesão média por venda</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Clientes Ativos - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{vendasMesAtual}</div>
            <p className="text-xs text-green-600 mt-1">Vendas ativas do mês vigente</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Vendas com Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{estatisticas.vendasLead}</div>
            <p className="text-xs text-slate-500 mt-1">{estatisticas.percentualLead.toFixed(1)}% do total</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Vendas com Indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{estatisticas.vendasComIndicacao}</div>
            <p className="text-xs text-slate-500 mt-1">{estatisticas.percentualIndicacao.toFixed(1)}% do total</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Vendas de Outros Canais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{estatisticas.vendasOutrosCanais}</div>
            <p className="text-xs text-slate-500 mt-1">{estatisticas.percentualOutrosCanais.toFixed(1)}% do total</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Vendedores - Para Líder, Master e Admin */}
      {(userFuncao === "lider" || userFuncao === "master" || userRole === "admin") && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#EFC200]" />
              Performance dos Consultores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-700">Posição</TableHead>
                  <TableHead className="text-slate-700">Consultor</TableHead>
                  <TableHead className="text-center text-slate-700">Total Vendas</TableHead>
                  <TableHead className="text-center text-slate-700">Ticket Médio</TableHead>
                  <TableHead className="text-right text-slate-700">Faturamento</TableHead>
                  <TableHead className="text-center text-slate-700">% Indicação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingVendedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
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
                        {vendedor.nome}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {vendedor.totalVendas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-900">
                        R$ {formatarValor(vendedor.ticketMedio)}
                      </TableCell>
                      <TableCell className="text-right text-slate-900 font-semibold">
                        R$ {formatarValor(vendedor.totalFaturamento)}
                      </TableCell>
                      <TableCell className="text-center text-slate-700">
                        {vendedor.percentualIndicacao.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canais de Venda */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Vendas por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosCanais.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosCanais}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosCanais.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_CANAIS[entry.canal] || "#94a3b8"} />
                    ))}
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

        {/* Planos Vendidos */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Vendas por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPlanos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPlanos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Estratégicos */}
      {(userFuncao === "lider" || userFuncao === "master" || userRole === "admin") && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Insights Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Melhor Consultor</div>
                <div className="text-lg font-bold text-slate-900">
                  {rankingVendedores[0]?.nome || "-"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {rankingVendedores[0]?.totalVendas || 0} vendas no período
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Canal Mais Efetivo</div>
                <div className="text-lg font-bold text-slate-900 capitalize">
                  {dadosCanais.sort((a, b) => b.value - a.value)[0]?.name || "-"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {dadosCanais.sort((a, b) => b.value - a.value)[0]?.value || 0} vendas
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Plano Mais Vendido</div>
                <div className="text-lg font-bold text-slate-900 capitalize">
                  {dadosPlanos.sort((a, b) => b.value - a.value)[0]?.name || "-"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {dadosPlanos.sort((a, b) => b.value - a.value)[0]?.value || 0} vendas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}