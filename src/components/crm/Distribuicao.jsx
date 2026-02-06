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
import { CheckCircle2, XCircle, Clock, TrendingUp, Settings, History, PlayCircle, Users, Calendar, UserCheck, UserX, Shield, Send, User } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Distribuicao({ userFuncao }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [vendedoresValidados, setVendedoresValidados] = useState([]);
  const [vendedorManual, setVendedorManual] = useState("");
  const [quantidadeManual, setQuantidadeManual] = useState(1);

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

  const createPrioridadeMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracaoDistribuicao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes_distribuicao"] });
    },
  });

  // Filtrar vendedores e líderes (incluindo masters)
  const vendedoresLideres = users.filter(u => 
    u.funcao === "vendedor" || u.funcao === "lider" || u.funcao === "master"
  );

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

  // Leads não distribuídos
  const leadsNaoDistribuidos = leads.filter(l => !l.distribuido);

  // Filtrar leads por período (manhã/tarde)
  const leadsDisponiveis = () => {
    const agora = new Date();
    const horaAtual = format(agora, "HH:mm");
    
    return leadsNaoDistribuidos.filter(lead => {
      if (!lead.data) return true;
      
      const dataLead = new Date(lead.data + "T00:00:00");
      const horaLead = lead.hora || "00:00";
      
      // Se o lead é de outro dia, disponibilizar
      if (format(dataLead, "yyyy-MM-dd") !== format(agora, "yyyy-MM-dd")) {
        return true;
      }
      
      // Se é de hoje, verificar o período
      if (horaLead <= horarioDistribuicaoManha) {
        return true; // Leads da manhã
      } else if (horaAtual >= horarioDistribuicaoTarde) {
        return true; // Já passou horário da tarde, liberar leads da tarde
      }
      
      return false; // Lead da tarde mas ainda não chegou o horário
    });
  };

  // Obter configurações
  const getConfig = (tipo, valorPadrao) => {
    const config = configuracoes.find(c => c.tipo === tipo);
    return config?.valor || valorPadrao;
  };

  const horarioLimiteSemana = getConfig("horario_limite_semana", "10:31");
  const horarioLimiteSabado = getConfig("horario_limite_sabado", "10:30");
  const limiteLeadsSabado = getConfig("limite_leads_sabado", "5");
  const horarioDistribuicaoManha = getConfig("horario_distribuicao_manha", "11:00");
  const horarioDistribuicaoTarde = getConfig("horario_distribuicao_tarde", "15:00");

  // Distribuir leads manualmente
  const distribuirManual = () => {
    if (!vendedorManual) {
      alert("Selecione um vendedor!");
      return;
    }

    if (quantidadeManual < 1) {
      alert("Quantidade deve ser maior que 0!");
      return;
    }

    const leadsParaEnviar = leadsDisponiveis().slice(0, quantidadeManual);

    if (leadsParaEnviar.length === 0) {
      alert("Não há leads disponíveis para distribuir!");
      return;
    }

    // Verificar se há configuração de prioridade para este vendedor
    const prioridadeConfig = configuracoes.find(
      c => c.tipo === `prioridade_${vendedorManual}`
    );

    if (prioridadeConfig) {
      // Atualizar quantidade de prioridade
      const novaQuantidade = parseInt(prioridadeConfig.valor) + quantidadeManual;
      updateConfigMutation.mutate({
        id: prioridadeConfig.id,
        data: { valor: novaQuantidade.toString() }
      });
    } else {
      // Criar nova configuração de prioridade
      createPrioridadeMutation.mutate({
        tipo: `prioridade_${vendedorManual}`,
        valor: quantidadeManual.toString()
      });
    }

    // Distribuir leads
    leadsParaEnviar.forEach(lead => {
      createNegociacaoMutation.mutate({
        vendedor_email: vendedorManual,
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

    alert(`${leadsParaEnviar.length} lead(s) distribuído(s) para ${getNomeUsuario(vendedorManual)}!`);
    setVendedorManual("");
    setQuantidadeManual(1);
  };

  // Distribuir leads automaticamente
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

    const leadsParaDistribuir = leadsDisponiveis();

    if (leadsParaDistribuir.length === 0) {
      alert("Não há leads disponíveis para distribuir neste período!");
      return;
    }

    if (isSabado) {
      // Sábado: 5 leads por pessoa
      const limite = parseInt(limiteLeadsSabado);
      let leadsRestantes = [...leadsParaDistribuir];

      vendedoresElegiveis.forEach(vendedor => {
        const leadsVendedor = leadsRestantes.slice(0, limite);
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
        
        leadsRestantes = leadsRestantes.slice(limite);
      });
    } else {
      // Segunda a sexta: por taxa de conversão com prioridade
      const vendedoresOrdenados = vendedoresElegiveis
        .map(v => {
          const prioridadeConfig = configuracoes.find(c => c.tipo === `prioridade_${v.email}`);
          return {
            ...v,
            taxaConversao: parseFloat(calcularTaxaConversao(v.email)),
            prioridade: prioridadeConfig ? parseInt(prioridadeConfig.valor) : 0,
            prioridadeConfigId: prioridadeConfig?.id
          };
        })
        .sort((a, b) => {
          // Primeiro por prioridade (maior primeiro), depois por taxa (menor primeiro)
          if (b.prioridade !== a.prioridade) {
            return b.prioridade - a.prioridade;
          }
          return a.taxaConversao - b.taxaConversao;
        });

      let leadsRestantes = [...leadsParaDistribuir];
      let indiceVendedor = 0;

      leadsRestantes.forEach(lead => {
        const vendedor = vendedoresOrdenados[indiceVendedor % vendedoresOrdenados.length];
        
        // Se tem prioridade, decrementar
        if (vendedor.prioridade > 0 && vendedor.prioridadeConfigId) {
          updateConfigMutation.mutate({
            id: vendedor.prioridadeConfigId,
            data: { valor: (vendedor.prioridade - 1).toString() }
          });
          vendedor.prioridade--;
        }
        
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

        indiceVendedor++;
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
                <div className="text-3xl font-bold text-[#EFC200]">{leadsDisponiveis().length}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {leadsNaoDistribuidos.length} total
                </p>
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
                    disabled={leadsDisponiveis().length === 0 || !isValidado}
                    title={!isValidado ? "É necessário validar as chegadas primeiro" : ""}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Distribuir Leads Automático
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
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Distribuição Manual de Leads
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Envie leads manualmente para vendedores específicos. O vendedor receberá prioridade nos próximos leads automáticos.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Como funciona:</strong> Ao enviar leads manualmente, o vendedor selecionado terá prioridade 
                    na próxima distribuição automática pela quantidade de leads enviados. Depois disso, volta para a fila normal.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Leads Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-[#EFC200]">{leadsDisponiveis().length}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Período atual
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Total na Fila</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-600">{leadsNaoDistribuidos.length}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Todos os períodos
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Vendedores Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{vendedoresValidados.length}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Validados hoje
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">Enviar Leads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="vendedor-manual">Vendedor</Label>
                      <select
                        id="vendedor-manual"
                        value={vendedorManual}
                        onChange={(e) => setVendedorManual(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#EFC200]"
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
                      <Label htmlFor="quantidade-manual">Quantidade de Leads</Label>
                      <Input
                        id="quantidade-manual"
                        type="number"
                        min="1"
                        max={leadsDisponiveis().length}
                        value={quantidadeManual}
                        onChange={(e) => setQuantidadeManual(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <Button
                      onClick={distribuirManual}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={!vendedorManual || leadsDisponiveis().length === 0}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Leads
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">Lista de Vendedores</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor/Líder</TableHead>
                        <TableHead>Taxa Conversão</TableHead>
                        <TableHead>Negociações</TableHead>
                        <TableHead>Prioridade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendedoresLideres.map(vendedor => {
                        const negociacoesVendedor = negociacoes.filter(n => n.vendedor_email === vendedor.email);
                        const taxaConversao = calcularTaxaConversao(vendedor.email);
                        const prioridadeConfig = configuracoes.find(c => c.tipo === `prioridade_${vendedor.email}`);
                        const prioridade = prioridadeConfig ? parseInt(prioridadeConfig.valor) : 0;

                        return (
                          <TableRow key={vendedor.email}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                {vendedor.full_name || vendedor.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold">
                                {taxaConversao}%
                              </Badge>
                            </TableCell>
                            <TableCell>{negociacoesVendedor.length}</TableCell>
                            <TableCell>
                              {prioridade > 0 ? (
                                <Badge className="bg-orange-500 text-white">
                                  +{prioridade} leads
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-sm">-</span>
                              )}
                            </TableCell>
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
                  <Label>Horário Distribuição Manhã</Label>
                  <Input
                    type="time"
                    defaultValue={horarioDistribuicaoManha}
                    onBlur={(e) => salvarConfiguracao("horario_distribuicao_manha", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Leads até este horário serão distribuídos pela manhã
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Horário Distribuição Tarde</Label>
                  <Input
                    type="time"
                    defaultValue={horarioDistribuicaoTarde}
                    onBlur={(e) => salvarConfiguracao("horario_distribuicao_tarde", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Leads após o horário da manhã serão distribuídos a partir deste horário
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
                    <strong>Segunda a Sexta:</strong> Distribuição por taxa de conversão (com prioridade) para quem fizer check-in até {horarioLimiteSemana}
                  </li>
                  <li>
                    <strong>Sábado:</strong> Máximo {limiteLeadsSabado} leads por vendedor que fizer check-in até {horarioLimiteSabado}
                  </li>
                  <li>
                    <strong>Domingo:</strong> Sem distribuição
                  </li>
                  <li>
                    <strong>Períodos:</strong> Leads até {horarioDistribuicaoManha} são distribuídos pela manhã. Leads após este horário são distribuídos a partir das {horarioDistribuicaoTarde}
                  </li>
                  <li>
                    <strong>Prioridade:</strong> Vendedores com distribuição manual recebem prioridade na próxima distribuição automática
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