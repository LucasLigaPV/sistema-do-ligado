import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Award, BarChart3, MousePointer, Layers, Image } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function DashboardMarketing() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  // Filtrar por período
  const leadsFiltrados = leads.filter(l => {
    const dataLead = new Date(l.data || l.created_date);
    return (!startDate || dataLead >= new Date(startDate)) &&
           (!endDate || dataLead <= new Date(endDate + "T23:59:59"));
  });

  const negociacoesFiltradas = negociacoes.filter(n => {
    const dataEntrada = new Date(n.data_entrada || n.created_date);
    return (!startDate || dataEntrada >= new Date(startDate)) &&
           (!endDate || dataEntrada <= new Date(endDate + "T23:59:59")) &&
           n.origem === "lead";
  });

  // Métricas gerais
  const totalLeads = leadsFiltrados.length;
  const leadsDistribuidos = leadsFiltrados.filter(l => l.distribuido).length;
  const vendasAtivas = negociacoesFiltradas.filter(n => n.etapa === "venda_ativa").length;
  const taxaDistribuicao = totalLeads > 0 ? ((leadsDistribuidos / totalLeads) * 100).toFixed(1) : 0;
  const taxaConversao = leadsDistribuidos > 0 ? ((vendasAtivas / leadsDistribuidos) * 100).toFixed(1) : 0;

  // Análise por Plataforma
  const plataformaStats = {};
  leadsFiltrados.forEach(l => {
    const plataforma = l.plataforma || "Não informado";
    if (!plataformaStats[plataforma]) {
      plataformaStats[plataforma] = {
        leads: 0,
        distribuidos: 0,
        vendas: 0
      };
    }
    plataformaStats[plataforma].leads++;
    if (l.distribuido) plataformaStats[plataforma].distribuidos++;
  });

  negociacoesFiltradas.forEach(n => {
    const plataforma = n.plataforma || "Não informado";
    if (plataformaStats[plataforma] && n.etapa === "venda_ativa") {
      plataformaStats[plataforma].vendas++;
    }
  });

  const plataformasOrdenadas = Object.entries(plataformaStats)
    .map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaConversao: stats.distribuidos > 0 ? ((stats.vendas / stats.distribuidos) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.leads - a.leads);

  // Análise por Campanha
  const campanhaStats = {};
  leadsFiltrados.forEach(l => {
    const campanha = l.campanha || "Não informado";
    if (!campanhaStats[campanha]) {
      campanhaStats[campanha] = {
        leads: 0,
        distribuidos: 0,
        vendas: 0,
        plataforma: l.plataforma || ""
      };
    }
    campanhaStats[campanha].leads++;
    if (l.distribuido) campanhaStats[campanha].distribuidos++;
  });

  negociacoesFiltradas.forEach(n => {
    const campanha = n.campanha || "Não informado";
    if (campanhaStats[campanha] && n.etapa === "venda_ativa") {
      campanhaStats[campanha].vendas++;
    }
  });

  const campanhasOrdenadas = Object.entries(campanhaStats)
    .map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaConversao: stats.distribuidos > 0 ? ((stats.vendas / stats.distribuidos) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.vendas - a.vendas);

  // Análise por Conjunto de Anúncios (AdSet)
  const adsetStats = {};
  leadsFiltrados.forEach(l => {
    const adset = l.adset || "Não informado";
    if (!adsetStats[adset]) {
      adsetStats[adset] = {
        leads: 0,
        distribuidos: 0,
        vendas: 0,
        campanha: l.campanha || ""
      };
    }
    adsetStats[adset].leads++;
    if (l.distribuido) adsetStats[adset].distribuidos++;
  });

  negociacoesFiltradas.forEach(n => {
    const adset = n.adset || "Não informado";
    if (adsetStats[adset] && n.etapa === "venda_ativa") {
      adsetStats[adset].vendas++;
    }
  });

  const adsetsOrdenados = Object.entries(adsetStats)
    .map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaConversao: stats.distribuidos > 0 ? ((stats.vendas / stats.distribuidos) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.vendas - a.vendas);

  // Análise por Criativo (Ad)
  const adStats = {};
  leadsFiltrados.forEach(l => {
    const ad = l.ad || "Não informado";
    if (!adStats[ad]) {
      adStats[ad] = {
        leads: 0,
        distribuidos: 0,
        vendas: 0,
        adset: l.adset || ""
      };
    }
    adStats[ad].leads++;
    if (l.distribuido) adStats[ad].distribuidos++;
  });

  negociacoesFiltradas.forEach(n => {
    const ad = n.ad || "Não informado";
    if (adStats[ad] && n.etapa === "venda_ativa") {
      adStats[ad].vendas++;
    }
  });

  const adsOrdenados = Object.entries(adStats)
    .map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaConversao: stats.distribuidos > 0 ? ((stats.vendas / stats.distribuidos) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.vendas - a.vendas);

  // Análise por Posicionamento
  const posicionamentoStats = {};
  leadsFiltrados.forEach(l => {
    const posicionamento = l.posicionamento || "Não informado";
    if (!posicionamentoStats[posicionamento]) {
      posicionamentoStats[posicionamento] = {
        leads: 0,
        distribuidos: 0,
        vendas: 0
      };
    }
    posicionamentoStats[posicionamento].leads++;
    if (l.distribuido) posicionamentoStats[posicionamento].distribuidos++;
  });

  negociacoesFiltradas.forEach(n => {
    const posicionamento = n.posicionamento || "Não informado";
    if (posicionamentoStats[posicionamento] && n.etapa === "venda_ativa") {
      posicionamentoStats[posicionamento].vendas++;
    }
  });

  const posicionamentosOrdenados = Object.entries(posicionamentoStats)
    .map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaConversao: stats.distribuidos > 0 ? ((stats.vendas / stats.distribuidos) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.vendas - a.vendas);

  // Análise por Página
  const paginaStats = {};
  leadsFiltrados.forEach(l => {
    const pagina = l.pagina || "Não informado";
    if (!paginaStats[pagina]) {
      paginaStats[pagina] = {
        leads: 0,
        distribuidos: 0,
        vendas: 0
      };
    }
    paginaStats[pagina].leads++;
    if (l.distribuido) paginaStats[pagina].distribuidos++;
  });

  negociacoesFiltradas.forEach(n => {
    const pagina = n.pagina || "Não informado";
    if (paginaStats[pagina] && n.etapa === "venda_ativa") {
      paginaStats[pagina].vendas++;
    }
  });

  const paginasOrdenadas = Object.entries(paginaStats)
    .map(([nome, stats]) => ({
      nome,
      ...stats,
      taxaConversao: stats.distribuidos > 0 ? ((stats.vendas / stats.distribuidos) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.vendas - a.vendas);

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
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
              <Target className="w-4 h-4" />
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalLeads}</div>
            <p className="text-xs text-slate-500 mt-1">Gerados no período</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{taxaDistribuicao}%</div>
            <p className="text-xs text-slate-500 mt-1">{leadsDistribuidos} leads distribuídos</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Award className="w-4 h-4" />
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
              <BarChart3 className="w-4 h-4" />
              Custo por Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">-</div>
            <p className="text-xs text-slate-500 mt-1">Integrar dados de custo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise */}
      <Tabs defaultValue="plataforma" className="space-y-4">
        <TabsList className="bg-white shadow-md p-1.5 rounded-xl h-14">
          <TabsTrigger value="plataforma" className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <MousePointer className="w-4 h-4" />
            Plataformas
          </TabsTrigger>
          <TabsTrigger value="campanha" className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <Target className="w-4 h-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="adset" className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <Layers className="w-4 h-4" />
            Conjuntos
          </TabsTrigger>
          <TabsTrigger value="ad" className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <Image className="w-4 h-4" />
            Criativos
          </TabsTrigger>
          <TabsTrigger value="posicionamento" className="gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4" />
            Posicionamento
          </TabsTrigger>
        </TabsList>

        {/* Análise por Plataforma */}
        <TabsContent value="plataforma">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Performance por Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700">Plataforma</TableHead>
                    <TableHead className="text-center text-slate-700">Leads</TableHead>
                    <TableHead className="text-center text-slate-700">Distribuídos</TableHead>
                    <TableHead className="text-center text-slate-700">Vendas</TableHead>
                    <TableHead className="text-center text-slate-700">Taxa Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plataformasOrdenadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    plataformasOrdenadas.map((plat, index) => (
                      <TableRow key={plat.nome} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">
                          {index < 3 && <span className="mr-2">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>}
                          {plat.nome}
                        </TableCell>
                        <TableCell className="text-center text-slate-700">{plat.leads}</TableCell>
                        <TableCell className="text-center text-slate-700">{plat.distribuidos}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {plat.vendas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {plat.taxaConversao}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise por Campanha */}
        <TabsContent value="campanha">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance por Campanha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700">Campanha</TableHead>
                    <TableHead className="text-slate-700">Plataforma</TableHead>
                    <TableHead className="text-center text-slate-700">Leads</TableHead>
                    <TableHead className="text-center text-slate-700">Distribuídos</TableHead>
                    <TableHead className="text-center text-slate-700">Vendas</TableHead>
                    <TableHead className="text-center text-slate-700">Taxa Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campanhasOrdenadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    campanhasOrdenadas.map((camp, index) => (
                      <TableRow key={camp.nome} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">
                          {index < 3 && <span className="mr-2">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>}
                          {camp.nome}
                        </TableCell>
                        <TableCell className="text-slate-700">{camp.plataforma}</TableCell>
                        <TableCell className="text-center text-slate-700">{camp.leads}</TableCell>
                        <TableCell className="text-center text-slate-700">{camp.distribuidos}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {camp.vendas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {camp.taxaConversao}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise por Conjunto de Anúncios */}
        <TabsContent value="adset">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Performance por Conjunto de Anúncios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700">Conjunto</TableHead>
                    <TableHead className="text-slate-700">Campanha</TableHead>
                    <TableHead className="text-center text-slate-700">Leads</TableHead>
                    <TableHead className="text-center text-slate-700">Distribuídos</TableHead>
                    <TableHead className="text-center text-slate-700">Vendas</TableHead>
                    <TableHead className="text-center text-slate-700">Taxa Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsetsOrdenados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    adsetsOrdenados.map((adset, index) => (
                      <TableRow key={adset.nome} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">
                          {index < 3 && <span className="mr-2">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>}
                          {adset.nome}
                        </TableCell>
                        <TableCell className="text-slate-700">{adset.campanha}</TableCell>
                        <TableCell className="text-center text-slate-700">{adset.leads}</TableCell>
                        <TableCell className="text-center text-slate-700">{adset.distribuidos}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {adset.vendas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {adset.taxaConversao}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise por Criativo */}
        <TabsContent value="ad">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Performance por Criativo (Anúncio)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700">Criativo</TableHead>
                    <TableHead className="text-slate-700">Conjunto</TableHead>
                    <TableHead className="text-center text-slate-700">Leads</TableHead>
                    <TableHead className="text-center text-slate-700">Distribuídos</TableHead>
                    <TableHead className="text-center text-slate-700">Vendas</TableHead>
                    <TableHead className="text-center text-slate-700">Taxa Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsOrdenados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    adsOrdenados.map((ad, index) => (
                      <TableRow key={ad.nome} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">
                          {index < 3 && <span className="mr-2">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>}
                          {ad.nome}
                        </TableCell>
                        <TableCell className="text-slate-700">{ad.adset}</TableCell>
                        <TableCell className="text-center text-slate-700">{ad.leads}</TableCell>
                        <TableCell className="text-center text-slate-700">{ad.distribuidos}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {ad.vendas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {ad.taxaConversao}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise por Posicionamento */}
        <TabsContent value="posicionamento">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance por Posicionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700">Posicionamento</TableHead>
                    <TableHead className="text-center text-slate-700">Leads</TableHead>
                    <TableHead className="text-center text-slate-700">Distribuídos</TableHead>
                    <TableHead className="text-center text-slate-700">Vendas</TableHead>
                    <TableHead className="text-center text-slate-700">Taxa Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posicionamentosOrdenados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    posicionamentosOrdenados.map((pos, index) => (
                      <TableRow key={pos.nome} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">
                          {index < 3 && <span className="mr-2">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>}
                          {pos.nome}
                        </TableCell>
                        <TableCell className="text-center text-slate-700">{pos.leads}</TableCell>
                        <TableCell className="text-center text-slate-700">{pos.distribuidos}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {pos.vendas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-900">
                          {pos.taxaConversao}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights Estratégicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Melhor Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">
              {plataformasOrdenadas[0]?.nome || "-"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {plataformasOrdenadas[0]?.vendas || 0} vendas • {plataformasOrdenadas[0]?.taxaConversao || 0}% conversão
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Melhor Criativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900 truncate">
              {adsOrdenados[0]?.nome || "-"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {adsOrdenados[0]?.vendas || 0} vendas • {adsOrdenados[0]?.taxaConversao || 0}% conversão
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm text-slate-700">Melhor Posicionamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">
              {posicionamentosOrdenados[0]?.nome || "-"}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {posicionamentosOrdenados[0]?.vendas || 0} vendas • {posicionamentosOrdenados[0]?.taxaConversao || 0}% conversão
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}