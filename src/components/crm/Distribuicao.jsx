import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, TrendingUp, Settings, History, PlayCircle, Users, Calendar, UserCheck, UserX, Shield, Send } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Distribuicao({ userFuncao }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [vendedoresValidados, setVendedoresValidados] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState("");
  const [quantidadeLeads, setQuantidadeLeads] = useState(1);

  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list(),
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ["checkins"],
    queryFn: () => base44.entities.Checkin.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  const { data: configuracoes = [] } = useQuery({
    queryKey: ["configuracoes_distribuicao"],
    queryFn: () => base44.entities.ConfiguracaoDistribuicao.list(),
  });

  const { data: validacoes = [] } = useQuery({
    queryKey: ["validacoes_chegada"],
    queryFn: () => base44.entities.ValidacaoChegada.list(),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const createNegociacaoMutation = useMutation({
    mutationFn: (data) => base44.entities.Negociacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConfiguracaoDistribuicao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes_distribuicao"] });
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracaoDistribuicao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes_distribuicao"] });
    },
  });

  const createValidacaoMutation = useMutation({
    mutationFn: (data) => base44.entities.ValidacaoChegada.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validacoes_chegada"] });
      setModoEdicao(false);
    },
  });

  const updateValidacaoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ValidacaoChegada.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validacoes_chegada"] });
      setModoEdicao(false);
    },
  });

  // Filtrar vendedores e líderes (verificar ambos role e funcao para compatibilidade)
  const vendedoresLideres = users.filter(u => 
    u.funcao === "vendedor" || u.funcao === "lider" || 
    u.role === "vendedor" || u.role === "lider"
  );

  console.log("Total de usuários:", users.length);
  console.log("Vendedores/Líderes filtrados:", vendedoresLideres.length);
  console.log("Usuários:", users.map(u => ({ email: u.email, funcao: u.funcao, role: u.role })));

  // Calcular taxa de conversão
  const calcularTaxaConversao = (email) => {
    const negociacoesVendedor = negociacoes.filter(n => n.vendedor_email === email);
    const vendasVendedor = negociacoesVendedor.filter(n => n.etapa === "venda_ativa");
    
    if (negociacoesVendedor.length === 0) return 0;
    return ((vendasVendedor.length / negociacoesVendedor.length) * 100).toFixed(1);
  };

  // Verificar check-in de hoje
  const hoje = format(new Date(), "yyyy-MM-dd");
  const checkinsHoje = checkins.filter(c => c.data === hoje);
  
  // Verificar se há validação hoje
  const validacaoHoje = validacoes.find(v => v.data === hoje);
  const isValidado = validacaoHoje !== undefined;

  // Atualizar lista de vendedores validados quando houver validação
  React.useEffect(() => {
    if (validacaoHoje) {
      setVendedoresValidados(validacaoHoje.vendedores_validados || []);
    } else {
      // Se não há validação, usar os que fizeram check-in dentro do prazo
      const emailsNoPrazo = checkinsHoje
        .filter(c => c.dentro_prazo)
        .map(c => c.usuario_email);
      setVendedoresValidados(emailsNoPrazo);
    }
  }, [validacaoHoje?.id]);

  // Filtrar check-ins por período
  const checkinsFiltrados = checkins.filter(c => {
    const checkinDate = new Date(c.data);
    return (!startDate || checkinDate >= new Date(startDate)) &&
           (!endDate || checkinDate <= new Date(endDate + "T23:59:59"));
  });

  // Filtrar por usuário se selecionado
  const checkinsExibir = selectedUser
    ? checkinsFiltrados.filter(c => c.usuario_email === selectedUser)
    : checkinsFiltrados;

  // Obter configurações
  const getConfig = (tipo, valorPadrao) => {
    const config = configuracoes.find(c => c.tipo === tipo);
    return config?.valor || valorPadrao;
  };

  const horarioLimiteSemana = getConfig("horario_limite_semana", "10:31");
  const horarioLimiteSabado = getConfig("horario_limite_sabado", "10:30");
  const limiteLeadsSabado = getConfig("limite_leads_sabado", "5");
  const horarioLimiteTarde = getConfig("horario_limite_tarde", "14:00");

  // Leads não distribuídos - filtrar por período (manhã/tarde)
  const agora = new Date();
  const horaAtual = format(agora, "HH:mm");
  
  const leadsNaoDistribuidos = leads.filter(l => {
    if (l.distribuido) return false;
    
    // Se não tem data, incluir
    if (!l.data) return true;
    
    // Verificar se o lead é de hoje
    const leadData = format(new Date(l.data), "yyyy-MM-dd");
    const hoje = format(new Date(), "yyyy-MM-dd");
    
    if (leadData !== hoje) return true; // Leads de outros dias sempre disponíveis
    
    // Leads de hoje: verificar horário
    // Se ainda não passou o horário da manhã, mostrar apenas leads da manhã
    if (horaAtual < horarioLimiteSemana) {
      // Mostrar leads que chegaram até o horário da manhã
      const leadHora = l.created_date ? format(new Date(l.created_date), "HH:mm") : "00:00";
      return leadHora < horarioLimiteSemana;
    } else if (horaAtual < horarioLimiteTarde) {
      // Entre manhã e tarde: não mostrar nenhum lead de hoje ainda
      return false;
    } else {
      // Após horário da tarde: mostrar leads que chegaram após horário da manhã
      const leadHora = l.created_date ? format(new Date(l.created_date), "HH:mm") : "00:00";
      return leadHora >= horarioLimiteSemana;
    }
  });

  // Distribuir leads
  const distribuirLeads = () => {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const isSabado = diaSemana === 6;
    const isDomingo = diaSemana === 0;

    if (isDomingo) {
      alert("Não há distribuição aos domingos!");
      return;
    }

    // Usar vendedores validados
    const vendedoresElegiveis = vendedoresLideres.filter(v => 
      vendedoresValidados.includes(v.email)
    );

    if (vendedoresElegiveis.length === 0) {
      alert("Nenhum vendedor/líder fez check-in dentro do prazo hoje!");
      return;
    }

    if (leadsNaoDistribuidos.length === 0) {
      alert("Não há leads para distribuir!");
      return;
    }

    // Embaralhar leads para distribuição randômica
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const leadsEmbaralhados = shuffleArray(leadsNaoDistribuidos);

    if (isSabado) {
      // Sábado: 5 leads por pessoa (randômico)
      const limite = parseInt(limiteLeadsSabado);
      let leadsParaDistribuir = [...leadsEmbaralhados];

      vendedoresElegiveis.forEach(vendedor => {
        const leadsVendedor = leadsParaDistribuir.slice(0, limite);
        leadsVendedor.forEach(lead => {
          // Criar negociação
          createNegociacaoMutation.mutate({
            vendedor_email: vendedor.email,
            etapa: "novo_lead",
            nome_cliente: lead.nome,
            telefone: lead.telefone,
            email: lead.email || "",
            placa: "",
            modelo_veiculo: lead.modelo || "",
            plano_interesse: "",
            origem: "lead",
            data_entrada: lead.data || format(new Date(), "yyyy-MM-dd"),
            plataforma: lead.plataforma || "",
            posicionamento: lead.posicionamento || "",
            ad: lead.ad || "",
            adset: lead.adset || "",
            campanha: lead.campanha || "",
            pagina: lead.pagina || ""
          });
          
          // Marcar lead como distribuído
          updateLeadMutation.mutate({
            id: lead.id,
            data: { distribuido: true }
          });
        });
        
        leadsParaDistribuir = leadsParaDistribuir.slice(limite);
      });
    } else {
      // Segunda a sexta: distribuição proporcional à taxa de conversão (randômico)
      const vendedoresComTaxa = vendedoresElegiveis
        .map(v => ({
          ...v,
          taxaConversao: parseFloat(calcularTaxaConversao(v.email))
        }));

      // Calcular soma total das taxas
      const somaTaxas = vendedoresComTaxa.reduce((sum, v) => sum + v.taxaConversao, 0);

      // Se todas taxas são 0, distribuir igualmente
      const distribuicaoIgual = somaTaxas === 0;

      // Calcular quantos leads cada vendedor deve receber
      const leadsDistribuicao = vendedoresComTaxa.map(v => {
        const proporcao = distribuicaoIgual 
          ? 1 / vendedoresComTaxa.length 
          : v.taxaConversao / somaTaxas;
        const quantidade = Math.floor(leadsEmbaralhados.length * proporcao);
        return { ...v, quantidadeLeads: quantidade };
      });

      // Distribuir leads restantes para quem tem maior taxa
      const totalDistribuido = leadsDistribuicao.reduce((sum, v) => sum + v.quantidadeLeads, 0);
      const leadsRestantes = leadsEmbaralhados.length - totalDistribuido;
      
      const vendedoresOrdenados = [...leadsDistribuicao].sort((a, b) => b.taxaConversao - a.taxaConversao);
      for (let i = 0; i < leadsRestantes; i++) {
        vendedoresOrdenados[i % vendedoresOrdenados.length].quantidadeLeads++;
      }

      // Distribuir leads
      let indiceLeadAtual = 0;
      leadsDistribuicao.forEach(vendedor => {
        const leadsVendedor = leadsEmbaralhados.slice(indiceLeadAtual, indiceLeadAtual + vendedor.quantidadeLeads);
        
        leadsVendedor.forEach(lead => {
          createNegociacaoMutation.mutate({
            vendedor_email: vendedor.email,
            etapa: "novo_lead",
            nome_cliente: lead.nome,
            telefone: lead.telefone,
            email: lead.email || "",
            placa: "",
            modelo_veiculo: lead.modelo || "",
            plano_interesse: "",
            origem: "lead",
            data_entrada: lead.data || format(new Date(), "yyyy-MM-dd"),
            plataforma: lead.plataforma || "",
            posicionamento: lead.posicionamento || "",
            ad: lead.ad || "",
            adset: lead.adset || "",
            campanha: lead.campanha || "",
            pagina: lead.pagina || ""
          });
          
          updateLeadMutation.mutate({
            id: lead.id,
            data: { distribuido: true }
          });
        });

        indiceLeadAtual += vendedor.quantidadeLeads;
      });
    }

    alert("Leads distribuídos com sucesso!");
  };

  const getNomeUsuario = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const salvarConfiguracao = (tipo, valor) => {
    const configExistente = configuracoes.find(c => c.tipo === tipo);
    
    if (configExistente) {
      updateConfigMutation.mutate({
        id: configExistente.id,
        data: { valor }
      });
    } else {
      createConfigMutation.mutate({ tipo, valor });
    }
  };

  const validarChegadas = async () => {
    const user = await base44.auth.me();
    const agora = new Date();
    
    if (validacaoHoje) {
      // Atualizar validação existente
      updateValidacaoMutation.mutate({
        id: validacaoHoje.id,
        data: {
          vendedores_validados: vendedoresValidados,
          validado_por: user.email,
          hora_validacao: format(agora, "HH:mm")
        }
      });
    } else {
      // Criar nova validação
      createValidacaoMutation.mutate({
        data: hoje,
        validado_por: user.email,
        vendedores_validados: vendedoresValidados,
        hora_validacao: format(agora, "HH:mm")
      });
    }
  };

  const toggleVendedor = (email) => {
    if (vendedoresValidados.includes(email)) {
      setVendedoresValidados(vendedoresValidados.filter(e => e !== email));
    } else {
      setVendedoresValidados([...vendedoresValidados, email]);
    }
  };

  const distribuirManual = () => {
    if (!vendedorSelecionado) {
      alert("Selecione um vendedor!");
      return;
    }

    if (quantidadeLeads < 1) {
      alert("Quantidade deve ser maior que 0!");
      return;
    }

    if (leadsNaoDistribuidos.length === 0) {
      alert("Não há leads para distribuir!");
      return;
    }

    const quantidade = Math.min(quantidadeLeads, leadsNaoDistribuidos.length);
    const leadsParaDistribuir = leadsNaoDistribuidos.slice(0, quantidade);

    leadsParaDistribuir.forEach(lead => {
      // Criar negociação
      createNegociacaoMutation.mutate({
        vendedor_email: vendedorSelecionado,
        etapa: "novo_lead",
        nome_cliente: lead.nome,
        telefone: lead.telefone,
        email: lead.email || "",
        placa: "",
        modelo_veiculo: lead.modelo || "",
        plano_interesse: "",
        origem: "lead",
        data_entrada: lead.data || format(new Date(), "yyyy-MM-dd"),
        plataforma: lead.plataforma || "",
        posicionamento: lead.posicionamento || "",
        ad: lead.ad || "",
        adset: lead.adset || "",
        campanha: lead.campanha || "",
        pagina: lead.pagina || "",
        prioridade: true // Marca como prioridade para próxima distribuição automática
      });
      
      // Marcar lead como distribuído
      updateLeadMutation.mutate({
        id: lead.id,
        data: { distribuido: true }
      });
    });

    alert(`${quantidade} lead(s) distribuído(s) com sucesso para ${getNomeUsuario(vendedorSelecionado)}!`);
    setVendedorSelecionado("");
    setQuantidadeLeads(1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dashboard">
        <TabsList className="bg-white shadow-md p-1.5 rounded-xl h-14">
          <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black">
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black">
            <Send className="w-4 h-4" />
            Distribuição Manual
          </TabsTrigger>
          <TabsTrigger value="checkins" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black">
            <UserCheck className="w-4 h-4" />
            Validação de Chegada
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Leads na Fila</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#EFC200]">{leadsNaoDistribuidos.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Check-ins Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{checkinsHoje.length}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {checkinsHoje.filter(c => c.dentro_prazo).length} no prazo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Vendedores Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{vendedoresLideres.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Taxa de Conversão por Vendedor</CardTitle>
                  <Button
                    onClick={distribuirLeads}
                    className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
                    disabled={leadsNaoDistribuidos.length === 0 || !isValidado}
                    title={!isValidado ? "É necessário validar as chegadas primeiro" : ""}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Distribuir Leads
                  </Button>
                </div>
                {!isValidado && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800 text-sm">
                    <Shield className="w-5 h-5" />
                    <span>
                      Para distribuir leads, é necessário validar as chegadas primeiro na aba "Validação de Chegada"
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor/Líder</TableHead>
                    <TableHead>Taxa de Conversão</TableHead>
                    <TableHead>Negociações</TableHead>
                    <TableHead>Vendas Ativas</TableHead>
                    <TableHead>Check-in Hoje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedoresLideres.map(vendedor => {
                    const negociacoesVendedor = negociacoes.filter(n => n.vendedor_email === vendedor.email);
                    const vendasVendedor = negociacoesVendedor.filter(n => n.etapa === "venda_ativa");
                    const taxaConversao = calcularTaxaConversao(vendedor.email);
                    const checkinHoje = checkinsHoje.find(c => c.usuario_email === vendedor.email);

                    return (
                      <TableRow key={vendedor.email}>
                        <TableCell className="font-medium">
                          {vendedor.full_name || vendedor.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {taxaConversao}%
                          </Badge>
                        </TableCell>
                        <TableCell>{negociacoesVendedor.length}</TableCell>
                        <TableCell>{vendasVendedor.length}</TableCell>
                        <TableCell>
                          {checkinHoje ? (
                            <div className="flex items-center gap-2">
                              {checkinHoje.dentro_prazo ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="text-sm">{checkinHoje.hora}</span>
                            </div>
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-300" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribuição Manual */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Manual de Leads</CardTitle>
              <p className="text-sm text-slate-600">
                Distribua leads manualmente para vendedores específicos. Os leads enviados manualmente terão prioridade na próxima distribuição automática.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-700" />
                    <span className="font-semibold text-blue-900">
                      Leads disponíveis na fila: {leadsNaoDistribuidos.length}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {horaAtual < horarioLimiteSemana
                      ? `Período da manhã - Distribuindo leads até ${horarioLimiteSemana}`
                      : horaAtual < horarioLimiteTarde
                      ? `Aguardando horário da tarde (${horarioLimiteTarde}) para distribuir novos leads`
                      : `Período da tarde - Distribuindo leads após ${horarioLimiteSemana}`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Vendedor</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white"
                      value={vendedorSelecionado}
                      onChange={(e) => setVendedorSelecionado(e.target.value)}
                    >
                      <option value="">Selecione um vendedor</option>
                      {vendedoresLideres.map(v => (
                        <option key={v.email} value={v.email}>
                          {v.full_name || v.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade de Leads</Label>
                    <Input
                      type="number"
                      min="1"
                      max={leadsNaoDistribuidos.length}
                      value={quantidadeLeads}
                      onChange={(e) => setQuantidadeLeads(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-slate-500">
                      Máximo disponível: {leadsNaoDistribuidos.length}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={distribuirManual}
                  className="w-full bg-[#EFC200] hover:bg-[#D4A900] text-black font-semibold h-12 text-lg"
                  disabled={!vendedorSelecionado || quantidadeLeads < 1 || leadsNaoDistribuidos.length === 0}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Enviar {quantidadeLeads} Lead(s)
                </Button>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Vendedores e Performance
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Taxa Conversão</TableHead>
                        <TableHead>Negociações</TableHead>
                        <TableHead>Vendas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendedoresLideres.map(vendedor => {
                        const negociacoesVendedor = negociacoes.filter(n => n.vendedor_email === vendedor.email);
                        const vendasVendedor = negociacoesVendedor.filter(n => n.etapa === "venda_ativa");
                        const taxaConversao = calcularTaxaConversao(vendedor.email);

                        return (
                          <TableRow key={vendedor.email}>
                            <TableCell className="font-medium">
                              {vendedor.full_name || vendedor.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold">
                                {taxaConversao}%
                              </Badge>
                            </TableCell>
                            <TableCell>{negociacoesVendedor.length}</TableCell>
                            <TableCell>{vendasVendedor.length}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validação de Chegada */}
        <TabsContent value="checkins" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Validação de Chegada - {format(new Date(), "dd/MM/yyyy")}</CardTitle>
                  <p className="text-sm text-slate-700 mt-1 font-medium">
                    {isValidado ? (
                      <span className="flex items-center gap-2 text-blue-700 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Chegadas validadas por {getNomeUsuario(validacaoHoje?.validado_por)} às {validacaoHoje?.hora_validacao}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-semibold">Validação pendente para distribuição de leads</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isValidado && !modoEdicao && (
                    <Button
                      variant="outline"
                      onClick={() => setModoEdicao(true)}
                    >
                      Alterar Validação
                    </Button>
                  )}
                  <Button
                    onClick={validarChegadas}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={vendedoresValidados.length === 0 || createValidacaoMutation.isPending}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {isValidado && !modoEdicao ? "Validado" : "Validar Chegadas"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <p className="text-sm text-blue-950 font-medium">
                    <strong className="font-bold">Instruções:</strong> Selecione os vendedores que devem receber leads hoje. 
                    Por padrão, são mostrados os vendedores que fizeram check-in dentro do prazo. 
                    Você pode adicionar ou remover vendedores manualmente conforme necessário.
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor/Líder</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">
                        {isValidado && !modoEdicao ? "Validado" : "Ação"}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendedoresLideres.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                          Nenhum vendedor/líder cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendedoresLideres.map(vendedor => {
                        const checkin = checkinsHoje.find(c => c.usuario_email === vendedor.email);
                        const isValidadoVendedor = vendedoresValidados.includes(vendedor.email);
                        const podeEditar = !isValidado || modoEdicao;
                        
                        return (
                          <TableRow key={vendedor.email} className={isValidadoVendedor ? "bg-blue-50 border-l-4 border-blue-400" : "hover:bg-slate-50"}>
                            <TableCell className="font-semibold text-slate-900">
                              {vendedor.full_name || vendedor.email}
                            </TableCell>
                            <TableCell>
                              {checkin ? (
                                checkin.dentro_prazo ? (
                                  <Badge className="bg-emerald-500 text-white font-medium">
                                    No Prazo
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500 text-white font-medium">
                                    Fora do Prazo
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="outline" className="bg-slate-100 text-slate-700 font-medium border-slate-300">
                                  Sem Check-in
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">
                              {checkin ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-500" />
                                  <span className="font-semibold">{checkin.hora}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm font-medium">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isValidadoVendedor ? (
                                <Badge className="bg-blue-500 text-white font-medium">
                                  ✓ Validado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-slate-300 text-slate-600 font-medium">
                                  Não Validado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant={isValidadoVendedor ? "outline" : "default"}
                                onClick={() => toggleVendedor(vendedor.email)}
                                disabled={!podeEditar}
                                className={`font-medium ${!podeEditar ? "opacity-50 cursor-not-allowed" : ""} ${isValidadoVendedor ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "bg-[#EFC200] hover:bg-[#D4A900] text-black"}`}
                              >
                                {isValidadoVendedor ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-1" />
                                    Remover
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Adicionar
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-slate-800" />
                    <span className="font-bold text-slate-900 text-lg">
                      Total de vendedores validados: <span className="text-[#EFC200] text-2xl">{vendedoresValidados.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Distribuição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Horário Limite (Segunda a Sexta)</Label>
                  <Input
                    type="time"
                    defaultValue={horarioLimiteSemana}
                    onBlur={(e) => salvarConfiguracao("horario_limite_semana", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Check-ins após este horário não receberão leads
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Horário Limite (Sábado)</Label>
                  <Input
                    type="time"
                    defaultValue={horarioLimiteSabado}
                    onBlur={(e) => salvarConfiguracao("horario_limite_sabado", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Check-ins após este horário não receberão leads
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Limite de Leads (Sábado)</Label>
                  <Input
                    type="number"
                    defaultValue={limiteLeadsSabado}
                    onBlur={(e) => salvarConfiguracao("limite_leads_sabado", e.target.value)}
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-slate-500">
                    Quantidade máxima de leads por vendedor aos sábados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Horário Distribuição da Tarde</Label>
                  <Input
                    type="time"
                    defaultValue={horarioLimiteTarde}
                    onBlur={(e) => salvarConfiguracao("horario_limite_tarde", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Horário para distribuir leads que chegaram após o período da manhã
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Regras Atuais
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    <strong>Segunda a Sexta:</strong> Distribuição por taxa de conversão para quem fizer check-in até {horarioLimiteSemana}
                  </li>
                  <li>
                    <strong>Horário da Manhã:</strong> Leads que chegam até {horarioLimiteSemana} são distribuídos no período da manhã
                  </li>
                  <li>
                    <strong>Horário da Tarde:</strong> Leads que chegam após {horarioLimiteSemana} são distribuídos a partir de {horarioLimiteTarde}
                  </li>
                  <li>
                    <strong>Sábado:</strong> Máximo {limiteLeadsSabado} leads por vendedor que fizer check-in até {horarioLimiteSabado}
                  </li>
                  <li>
                    <strong>Domingo:</strong> Sem distribuição
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}