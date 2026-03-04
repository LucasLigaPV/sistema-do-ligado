import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DashboardLider({ userEmail }) {
  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list("-created_date"),
  });



  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.filter({ ativa: true }),
  });

  const { usuarios: users } = useUsuarios();

  // Obter equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail);
  const membrosEquipe = minhaEquipe ? [userEmail, ...(minhaEquipe.membros || [])] : [];

  // Filtrar vendas da equipe
  const vendasEquipe = vendas.filter(v => membrosEquipe.includes(v.vendedor));
  const vendasAtivas = vendasEquipe.filter(v => v.etapa === "ativo");

  // Estatísticas gerais
  const totalVendas = vendasAtivas.length;
  const totalAdesao = vendasAtivas.reduce((sum, v) => {
    const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
    return sum + valor;
  }, 0);



  // Vendas por vendedor
  const vendasPorVendedor = membrosEquipe.map(email => {
    const user = users.find(u => u.email && u.email.toLowerCase() === email?.toLowerCase());
    const vendasDoVendedor = vendasAtivas.filter(v => v.vendedor === email);
    return {
      nome: user?.full_name || email,
      vendas: vendasDoVendedor.length,
      adesao: vendasDoVendedor.reduce((sum, v) => {
        const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
        return sum + valor;
      }, 0)
    };
  }).sort((a, b) => b.vendas - a.vendas);

  // Vendas por canal
  const canaisData = vendasAtivas.reduce((acc, v) => {
    const canal = v.canal_venda || "outros";
    acc[canal] = (acc[canal] || 0) + 1;
    return acc;
  }, {});

  const chartCanais = Object.entries(canaisData).map(([canal, count]) => ({
    name: canal === "lead" ? "Lead" : canal === "indicacao" ? "Indicação" : canal === "troca_veiculo" ? "Troca Veículo" : canal,
    value: count,
  }));

  const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  // Vendas por plano
  const planoCount = vendasAtivas.reduce((acc, v) => {
    acc[v.plano_vendido] = (acc[v.plano_vendido] || 0) + 1;
    return acc;
  }, {});

  const chartPlanos = Object.entries(planoCount).map(([plano, count]) => ({
    name: plano.charAt(0).toUpperCase() + plano.slice(1),
    value: count,
  }));



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard da Equipe</h2>
        <p className="text-slate-500">
          {minhaEquipe?.nome || "Minha Equipe"} • {membrosEquipe.length} membros
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p className="text-sm text-slate-500">Total Adesão</p>
                <p className="text-3xl font-bold text-slate-900">
                  R$ {totalAdesao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Membros Equipe</p>
                <p className="text-3xl font-bold text-slate-900">{membrosEquipe.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas por Vendedor */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Desempenho por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendasPorVendedor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranking da Equipe */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Ranking da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendasPorVendedor.map((vendedor, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? "bg-[#EFC200] text-black" :
                  index === 1 ? "bg-slate-300 text-slate-700" :
                  index === 2 ? "bg-amber-600 text-white" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{vendedor.nome}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span>{vendedor.vendas} vendas</span>
                    <span>R$ {vendedor.adesao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="w-32">
                  <Progress 
                    value={(vendedor.vendas / Math.max(...vendasPorVendedor.map(v => v.vendas))) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Canais de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            {chartCanais.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartCanais}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartCanais.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
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

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Planos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {chartPlanos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartPlanos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartPlanos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
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
      </div>


    </div>
  );
}