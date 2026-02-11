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

const CORES_CANAIS = {
  lead: "#3b82f6",
  indicacao: "#10b981",
  troca_veiculo: "#f59e0b",
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

  const vendas = userRole === "admin" 
    ? allVendas 
    : userFuncao === "lider"
    ? allVendas.filter((v) => membrosEquipe.includes(v.vendedor))
    : allVendas.filter(v => v.vendedor === userEmail);

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
      return true;
    });
  }, [vendas, dataInicio, dataFim]);

  const estatisticas = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const totalFaturamento = vendasFiltradas.reduce((sum, v) => {
      const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      return sum + valor;
    }, 0);

    const vendasAtivas = vendasFiltradas.filter(v => v.etapa === "ativo").length;
    const vendasPagamentoOk = vendasFiltradas.filter(v => v.etapa === "pagamento_ok").length;

    return { totalVendas, totalFaturamento, vendasAtivas, vendasPagamentoOk };
  }, [vendasFiltradas]);

  const rankingVendedores = useMemo(() => {
    if (userFuncao !== "lider" && userRole !== "admin") return [];
    
    const vendedoresMap = {};
    
    vendasFiltradas.forEach(venda => {
      if (!vendedoresMap[venda.vendedor]) {
        const usuario = usuarios.find(u => u.email === venda.vendedor);
        vendedoresMap[venda.vendedor] = {
          nome: usuario?.full_name || venda.vendedor,
          email: venda.vendedor,
          totalVendas: 0,
          totalFaturamento: 0,
        };
      }
      
      vendedoresMap[venda.vendedor].totalVendas += 1;
      const valor = parseFloat(venda.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
      vendedoresMap[venda.vendedor].totalFaturamento += valor;
    });

    return Object.values(vendedoresMap)
      .sort((a, b) => b.totalVendas - a.totalVendas)
      .slice(0, 10);
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

    return Object.entries(canais).map(([canal, data]) => ({
      name: canal === "lead" ? "Lead" : canal === "indicacao" ? "Indicação" : canal === "troca_veiculo" ? "Troca Veículo" : canal,
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

    return Object.entries(planos).map(([plano, data]) => ({
      name: plano === "essencial" ? "Essencial" : "Principal",
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Vendas</p>
                <p className="text-3xl font-bold text-slate-900">{estatisticas.totalVendas}</p>
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
                <p className="text-sm text-slate-500">Faturamento Total</p>
                <p className="text-2xl font-bold text-[#EFC200]">
                  R$ {formatarValor(estatisticas.totalFaturamento)}
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
                <p className="text-sm text-slate-500">Vendas Ativas</p>
                <p className="text-3xl font-bold text-emerald-600">{estatisticas.vendasAtivas}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pagamento OK</p>
                <p className="text-3xl font-bold text-amber-600">{estatisticas.vendasPagamentoOk}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ranking de Vendedores - Apenas para Líder e Admin */}
      {(userFuncao === "lider" || userRole === "admin") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#EFC200]" />
                Ranking de Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingVendedores.length > 0 ? (
                  rankingVendedores.map((vendedor, index) => (
                    <motion.div
                      key={vendedor.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? "bg-[#EFC200] text-black" :
                          index === 1 ? "bg-slate-300 text-slate-700" :
                          index === 2 ? "bg-amber-600 text-white" :
                          "bg-slate-200 text-slate-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{vendedor.nome}</p>
                          <p className="text-xs text-slate-500">{vendedor.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{vendedor.totalVendas} vendas</p>
                        <p className="text-sm text-emerald-600">R$ {formatarValor(vendedor.totalFaturamento)}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    Nenhum vendedor encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canais de Venda */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Vendas por Canal</CardTitle>
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
        </motion.div>

        {/* Planos Vendidos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Vendas por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosPlanos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosPlanos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Quantidade" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}