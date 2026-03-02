import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Settings, PlayCircle, Users, Calendar, UserCheck, UserX, Shield, Send, LayoutDashboard, RefreshCw, Percent, BookOpen, Save, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Distribuicao({ userFuncao }) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedUser, setSelectedUser] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [vendedoresValidados, setVendedoresValidados] = useState([]);
  const [modoEdicao2Turno, setModoEdicao2Turno] = useState(false);
  const [vendedoresValidados2Turno, setVendedoresValidados2Turno] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState("");
  const [quantidadeLeads, setQuantidadeLeads] = useState(1);
  const [savingPercentuais, setSavingPercentuais] = useState(false);
  const [savedPercentuais, setSavedPercentuais] = useState(false);
  const [savingHorarios, setSavingHorarios] = useState(false);
  const [savedHorarios, setSavedHorarios] = useState(false);
  const [horariosSemana, setHorariosSemana] = useState({});
  const [horariosSabado, setHorariosSabado] = useState({});
  const [percentuaisEdit, setPercentuaisEdit] = useState({});

  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list(),
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unsubscribe = base44.entities.Lead.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    });
    return unsubscribe;
  }, [queryClient]);

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

  const { data: usersAdmin = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        return await base44.entities.User.list();
      } catch (error) {
        return [];
      }
    },
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

  // Construir lista de usuários a partir de outras entidades (fallback quando user.list falha)
  const users = React.useMemo(() => {
    if (usersAdmin.length > 0) return usersAdmin;

    // Se não temos acesso aos users, construir lista de vendedores/líderes únicos
    const usuariosMap = new Map();

    // Adicionar de negociações como vendedor
    negociacoes.forEach(n => {
      if (n.vendedor_email && !usuariosMap.has(n.vendedor_email)) {
        usuariosMap.set(n.vendedor_email, {
          email: n.vendedor_email,
          full_name: n.vendedor_email.split('@')[0],
          funcao: "vendedor"
        });
      }
    });

    // Adicionar de equipes
    equipes.forEach(e => {
      // Líder
      if (e.lider_email) {
        usuariosMap.set(e.lider_email, {
          email: e.lider_email,
          full_name: e.lider_email.split('@')[0],
          funcao: "lider"
        });
      }
      // Membros como vendedores
      e.membros?.forEach(email => {
        if (!usuariosMap.has(email)) {
          usuariosMap.set(email, {
            email,
            full_name: email.split('@')[0],
            funcao: "vendedor"
          });
        }
      });
    });

    // Adicionar de checkins como vendedor
    checkins.forEach(c => {
      if (c.usuario_email && !usuariosMap.has(c.usuario_email)) {
        usuariosMap.set(c.usuario_email, {
          email: c.usuario_email,
          full_name: c.usuario_email.split('@')[0],
          funcao: "vendedor"
        });
      }
    });

    return Array.from(usuariosMap.values());
  }, [usersAdmin, negociacoes, equipes, checkins]);

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
      setModoEdicao2Turno(false);
    },
  });

  // Coletar todos os emails que estão em equipes ativas (líderes + membros)
  const emailsEmEquipes = React.useMemo(() => {
    const emails = new Set();
    equipes.filter(e => e.ativa !== false).forEach(e => {
      if (e.lider_email) emails.add(e.lider_email);
      (e.membros || []).forEach(m => emails.add(m));
    });
    return emails;
  }, [equipes]);

  // Filtrar apenas usuários que fazem parte de equipes ativas, excluindo admin
  const vendedoresLideres = users.filter(u => {
    if (u.role === "admin") return false;
    if (u.funcao === "master") return false;
    return emailsEmEquipes.has(u.email);
  });

  // Obter percentual de distribuição de um vendedor salvo nas configurações
  const getPercentualVendedor = (email) => {
    const config = configuracoes.find(c => c.tipo === `percentual_${email}`);
    return config ? parseFloat(config.valor) : 100;
  };

  const salvarPercentualVendedor = (email, valor) => {
    const tipo = `percentual_${email}`;
    const configExistente = configuracoes.find(c => c.tipo === tipo);
    const valorSalvo = Math.min(100, Math.max(0, parseFloat(valor) || 0));
    if (configExistente) {
      updateConfigMutation.mutate({ id: configExistente.id, data: { valor: String(valorSalvo) } });
    } else {
      createConfigMutation.mutate({ tipo, valor: String(valorSalvo) });
    }
  };

  const salvarTodosPercentuais = async () => {
    setSavingPercentuais(true);
    setSavedPercentuais(false);
    const promises = vendedoresLideres.map(vendedor => {
      const valor = percentuaisEdit[vendedor.email] !== undefined
        ? percentuaisEdit[vendedor.email]
        : getPercentualVendedor(vendedor.email);
      return new Promise(resolve => { salvarPercentualVendedor(vendedor.email, valor); resolve(); });
    });
    await Promise.all(promises);
    await new Promise(r => setTimeout(r, 800));
    setSavingPercentuais(false);
    setSavedPercentuais(true);
    setTimeout(() => setSavedPercentuais(false), 3000);
  };

  const salvarTodosHorarios = async () => {
    setSavingHorarios(true);
    setSavedHorarios(false);
    const campos = [
      { tipo: "horario_limite_semana", valor: horariosSemana.limite || horarioLimiteSemana },
      { tipo: "horario_distribuicao_1turno", valor: horariosSemana.dist1 || horarioDistribuicao1Turno },
      { tipo: "horario_distribuicao_2turno", valor: horariosSemana.dist2 || horarioDistribuicao2Turno },
      { tipo: "horario_limite_sabado", valor: horariosSabado.limite || horarioLimiteSabado },
      { tipo: "horario_distribuicao_sabado", valor: horariosSabado.dist || horarioDistribuicaoSabado },
      { tipo: "limite_leads_sabado", valor: String(horariosSabado.limite_leads || limiteLeadsSabado) },
    ];
    campos.forEach(({ tipo, valor }) => salvarConfiguracao(tipo, valor));
    await new Promise(r => setTimeout(r, 800));
    setSavingHorarios(false);
    setSavedHorarios(true);
    setTimeout(() => setSavedHorarios(false), 3000);
  };

  // Verificar check-in de hoje
  const hoje = format(new Date(), "yyyy-MM-dd");
  const checkinsHoje = checkins.filter(c => c.data === hoje);
  
  // Verificar se há validação hoje
  const validacaoHoje = validacoes.find(v => v.data === hoje && v.turno === "1");
  const isValidado = validacaoHoje !== undefined;
  
  // Verificar se há validação do 2º turno hoje
  const validacao2TurnoHoje = validacoes.find(v => v.data === hoje && v.turno === "2");
  const isValidado2Turno = validacao2TurnoHoje !== undefined;

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

  // Atualizar lista de vendedores validados do 2º turno
  React.useEffect(() => {
    if (validacao2TurnoHoje) {
      setVendedoresValidados2Turno(validacao2TurnoHoje.vendedores_validados || []);
    } else {
      // Se não há validação do 2º turno, usar os que foram validados no 1º turno
      setVendedoresValidados2Turno(vendedoresValidados);
    }
  }, [validacao2TurnoHoje?.id, vendedoresValidados]);

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
  const horarioDistribuicao1Turno = getConfig("horario_distribuicao_1turno", "10:35");
  const horarioDistribuicao2Turno = getConfig("horario_distribuicao_2turno", "14:05");
  const horarioDistribuicaoSabado = getConfig("horario_distribuicao_sabado", "10:35");

  // Leads não distribuídos - filtrar por período (manhã/tarde)
  const agora = new Date();
  const horaAtual = format(agora, "HH:mm");
  
  const leadsNaoDistribuidos = leads.filter(l => {
    if (l.distribuido) return false;
    
    // Se não tem data, incluir
    if (!l.data) return true;
    
    // Verificar se o lead é de hoje
    const parsedLeadData = new Date(l.data);
    if (isNaN(parsedLeadData)) return true;
    const leadData = format(parsedLeadData, "yyyy-MM-dd");
    const hoje = format(new Date(), "yyyy-MM-dd");
    
    if (leadData !== hoje) return true; // Leads de outros dias sempre disponíveis
    
    // Leads de hoje: verificar horário
    // Se ainda não passou o horário da manhã, mostrar apenas leads da manhã
    if (horaAtual < horarioLimiteSemana) {
      // Mostrar leads que chegaram até o horário da manhã
      const leadCreatedDate = l.created_date ? new Date(l.created_date) : null;
      const leadHora = leadCreatedDate && !isNaN(leadCreatedDate) ? format(leadCreatedDate, "HH:mm") : "00:00";
      return leadHora < horarioLimiteSemana;
    } else if (horaAtual < horarioLimiteTarde) {
      // Entre manhã e tarde: não mostrar nenhum lead de hoje ainda
      return false;
    } else {
      // Após horário da tarde: mostrar leads que chegaram após horário da manhã
      const leadCreatedDate = l.created_date ? new Date(l.created_date) : null;
      const leadHora = leadCreatedDate && !isNaN(leadCreatedDate) ? format(leadCreatedDate, "HH:mm") : "00:00";
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

    // Embaralhar array (Fisher-Yates) - usado para leads e para a fila de round-robin
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
      const limite = parseInt(limiteLeadsSabado);
      const totalNecessario = limite * vendedoresElegiveis.length;
      const totalDisponivel = leadsEmbaralhados.length;

      // Calcular quantos leads cada vendedor vai receber
      let leadsParaCadaUm = limite;

      if (totalDisponivel < totalNecessario) {
        // Distribuição igualitária com o que tem
        leadsParaCadaUm = Math.floor(totalDisponivel / vendedoresElegiveis.length);

        if (leadsParaCadaUm === 0) {
          alert(`Não há leads suficientes para distribuir. São necessários pelo menos ${vendedoresElegiveis.length} leads (1 por vendedor), mas há apenas ${totalDisponivel} disponíveis.`);
          return;
        }

        const confirmado = window.confirm(
          `Não há leads suficientes para distribuir ${limite} por vendedor.\n\n` +
          `Total disponível: ${totalDisponivel} leads\n` +
          `Vendedores elegíveis: ${vendedoresElegiveis.length}\n\n` +
          `Deseja distribuir ${leadsParaCadaUm} lead(s) para cada vendedor?`
        );

        if (!confirmado) return;
      }

      let leadsParaDistribuir = [...leadsEmbaralhados];

      vendedoresElegiveis.forEach(vendedor => {
        const leadsVendedor = leadsParaDistribuir.slice(0, leadsParaCadaUm);
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
            hora_entrada: lead.created_date ? format(new Date(lead.created_date), "HH:mm") : format(new Date(), "HH:mm"),
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
        
        leadsParaDistribuir = leadsParaDistribuir.slice(leadsParaCadaUm);
      });
    } else {
      // Segunda a sexta: distribuição percentual por vendedor (fatia igual base + percentual individual)
      const n = vendedoresElegiveis.length;
      const totalLeads = leadsEmbaralhados.length;

      // Fatia base igualitária para cada vendedor
      const fatiaBase = Math.floor(totalLeads / n);
      // Usamos apenas fatiaBase * n leads (as sobras da divisão igualitária ficam na fila)
      const leadsParaUsar = leadsEmbaralhados.slice(0, fatiaBase * n);

      // Vendedores com 100% recebem as sobras dos que têm % menor
      const vendedores100 = vendedoresElegiveis.filter(v => getPercentualVendedor(v.email) >= 100);

      // Coletar leads a distribuir para cada vendedor e acumular sobras
      const distribuicaoPorVendedor = {};
      vendedoresElegiveis.forEach(v => { distribuicaoPorVendedor[v.email] = []; });

      let sobrasDasReducoes = [];

      let indice = 0;
      vendedoresElegiveis.forEach(vendedor => {
        const percentual = getPercentualVendedor(vendedor.email);
        const leadsDaFatia = leadsParaUsar.slice(indice, indice + fatiaBase);
        const quantidadeADistribuir = Math.floor(fatiaBase * percentual / 100);
        distribuicaoPorVendedor[vendedor.email] = leadsDaFatia.slice(0, quantidadeADistribuir);
        // Sobras do percentual < 100% vão para redistribuição
        const sobrasVendedor = leadsDaFatia.slice(quantidadeADistribuir);
        sobrasDasReducoes = [...sobrasDasReducoes, ...sobrasVendedor];
        indice += fatiaBase;
      });

      // Redistribuir sobras via round-robin embaralhado entre vendedores com 100%
      if (sobrasDasReducoes.length > 0 && vendedores100.length > 0) {
        // Embaralhar a ordem dos vendedores 100% para evitar vantagem fixa
        const vendedores100Embaralhados = shuffleArray([...vendedores100]);
        sobrasDasReducoes.forEach((lead, i) => {
          const vendedor = vendedores100Embaralhados[i % vendedores100Embaralhados.length];
          distribuicaoPorVendedor[vendedor.email].push(lead);
        });
      }
      // Se não há vendedores com 100%, as sobras ficam na fila (não são marcadas como distribuídas)

      // Aplicar a distribuição final
      vendedoresElegiveis.forEach(vendedor => {
        distribuicaoPorVendedor[vendedor.email].forEach(lead => {
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
            hora_entrada: lead.created_date ? format(new Date(lead.created_date), "HH:mm") : format(new Date(), "HH:mm"),
            plataforma: lead.plataforma || "",
            posicionamento: lead.posicionamento || "",
            ad: lead.ad || "",
            adset: lead.adset || "",
            campanha: lead.campanha || "",
            pagina: lead.pagina || ""
          });
          updateLeadMutation.mutate({ id: lead.id, data: { distribuido: true } });
        });
      });
    }

    alert("Leads distribuídos com sucesso!");
  };

  const getNomeUsuario = (email) => {
    const user = users.find(u => u.email === email);
    return user?.nome_exibicao || user?.full_name || email;
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
          hora_validacao: format(agora, "HH:mm"),
          turno: "1"
        }
      });
    } else {
      // Criar nova validação
      createValidacaoMutation.mutate({
        data: hoje,
        validado_por: user.email,
        vendedores_validados: vendedoresValidados,
        hora_validacao: format(agora, "HH:mm"),
        turno: "1"
      });
    }
  };

  const validarChegadas2Turno = async () => {
    const user = await base44.auth.me();
    const agora = new Date();
    
    if (validacao2TurnoHoje) {
      // Atualizar validação existente do 2º turno
      updateValidacaoMutation.mutate({
        id: validacao2TurnoHoje.id,
        data: {
          vendedores_validados: vendedoresValidados2Turno,
          validado_por: user.email,
          hora_validacao: format(agora, "HH:mm"),
          turno: "2"
        }
      });
    } else {
      // Criar nova validação do 2º turno
      createValidacaoMutation.mutate({
        data: hoje,
        validado_por: user.email,
        vendedores_validados: vendedoresValidados2Turno,
        hora_validacao: format(agora, "HH:mm"),
        turno: "2"
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

  const toggleVendedor2Turno = (email) => {
    if (vendedoresValidados2Turno.includes(email)) {
      setVendedoresValidados2Turno(vendedoresValidados2Turno.filter(e => e !== email));
    } else {
      setVendedoresValidados2Turno([...vendedoresValidados2Turno, email]);
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
        hora_entrada: lead.created_date ? format(new Date(lead.created_date), "HH:mm") : format(new Date(), "HH:mm"),
        plataforma: lead.plataforma || "",
        posicionamento: lead.posicionamento || "",
        ad: lead.ad || "",
        adset: lead.adset || "",
        campanha: lead.campanha || "",
        pagina: lead.pagina || "",
        prioridade: true
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
        <TabsList className="bg-transparent p-0 gap-3 h-auto border-0">
          <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <LayoutDashboard className="w-4 h-4" />
            Distribuir
          </TabsTrigger>
          <TabsTrigger value="checkins" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <UserCheck className="w-4 h-4" />
            Validação de Chegada
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <Send className="w-4 h-4" />
            Distribuição Manual
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all">
            <BookOpen className="w-4 h-4" />
            Regras
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Botões de Distribuição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">Distribuição de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Botões Segunda a Sexta */}
                {agora.getDay() !== 6 && agora.getDay() !== 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={distribuirLeads}
                      disabled={leadsNaoDistribuidos.length === 0 || !isValidado || horaAtual < horarioDistribuicao1Turno}
                      title={!isValidado ? "É necessário validar as chegadas primeiro" : horaAtual < horarioDistribuicao1Turno ? `Disponível a partir de ${horarioDistribuicao1Turno}` : ""}
                      className="flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <PlayCircle className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-slate-900">1º Turno</div>
                          <div className="text-xs text-slate-500">Distribuir leads da manhã</div>
                        </div>
                      </div>
                      {horaAtual < horarioDistribuicao1Turno && (
                        <Badge variant="outline" className="ml-2 text-xs border-slate-300 text-slate-600">
                          {horarioDistribuicao1Turno}
                        </Badge>
                      )}
                    </button>

                    <button
                      onClick={distribuirLeads}
                      disabled={leadsNaoDistribuidos.length === 0 || !isValidado2Turno || horaAtual < horarioDistribuicao2Turno}
                      title={!isValidado2Turno ? "É necessário validar as chegadas do 2º turno primeiro" : horaAtual < horarioDistribuicao2Turno ? `Disponível a partir de ${horarioDistribuicao2Turno}` : ""}
                      className="flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <PlayCircle className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-slate-900">2º Turno</div>
                          <div className="text-xs text-slate-500">Distribuir leads da tarde</div>
                        </div>
                      </div>
                      {horaAtual < horarioDistribuicao2Turno && (
                        <Badge variant="outline" className="ml-2 text-xs border-slate-300 text-slate-600">
                          {horarioDistribuicao2Turno}
                        </Badge>
                      )}
                    </button>
                  </div>
                )}

                {!isValidado2Turno && agora.getDay() !== 6 && agora.getDay() !== 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2 text-slate-700 text-sm">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>
                      Para distribuir leads do 2º turno, é necessário validar as chegadas do 2º turno
                    </span>
                  </div>
                )}

                {/* Divisor */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                </div>

                {/* Botão Sábado */}
                <button
                  onClick={distribuirLeads}
                  disabled={agora.getDay() !== 6 || leadsNaoDistribuidos.length === 0 || !isValidado || horaAtual < horarioDistribuicaoSabado}
                  title={agora.getDay() !== 6 ? "Disponível apenas aos sábados" : !isValidado ? "É necessário validar as chegadas primeiro" : horaAtual < horarioDistribuicaoSabado ? `Disponível a partir de ${horarioDistribuicaoSabado}` : ""}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <PlayCircle className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900">Sábado</div>
                      <div className="text-xs text-slate-500">{limiteLeadsSabado} leads por vendedor</div>
                    </div>
                  </div>
                  {agora.getDay() === 6 && horaAtual < horarioDistribuicaoSabado && (
                    <Badge variant="outline" className="ml-2 text-xs border-slate-300 text-slate-600">
                      {horarioDistribuicaoSabado}
                    </Badge>
                  )}
                </button>

                {!isValidado && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2 text-slate-700 text-sm">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>
                      É necessário validar as chegadas primeiro na aba "Validação de Chegada"
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
              <div className="flex items-center justify-between">
                <CardTitle>Vendedores e Percentuais</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                    queryClient.invalidateQueries({ queryKey: ["equipes"] });
                    queryClient.invalidateQueries({ queryKey: ["checkins"] });
                    queryClient.invalidateQueries({ queryKey: ["leads"] });
                  }}
                  className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor/Líder</TableHead>
                    <TableHead>% Distribuição</TableHead>
                    <TableHead>Check-in Hoje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedoresLideres.map(vendedor => {
                    const percentual = getPercentualVendedor(vendedor.email);
                    const checkinHoje = checkinsHoje.find(c => c.usuario_email === vendedor.email);

                    return (
                      <TableRow key={vendedor.email}>
                        <TableCell className="font-medium">
                          {vendedor.full_name || vendedor.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-semibold ${percentual === 100 ? "border-slate-300 text-slate-700" : "border-[#EFC200] text-[#D4A900]"}`}>
                            {percentual}%
                          </Badge>
                        </TableCell>
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

        {/* Validação de Chegada */}
        <TabsContent value="checkins" className="space-y-4">
          {/* Validação 1º Turno / Sábado */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Validação de Chegada {agora.getDay() === 6 ? "(Sábado)" : "(1º Turno)"} - {format(new Date(), "dd/MM/yyyy")}</CardTitle>
                  <p className="text-sm text-slate-700 mt-1 font-medium">
                    {isValidado ? (
                      <span className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Validado por {getNomeUsuario(validacaoHoje?.validado_por)} às {validacaoHoje?.hora_validacao}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Validação pendente</span>
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
                    className="bg-slate-900 hover:bg-slate-800 text-white"
                    disabled={vendedoresValidados.length === 0 || createValidacaoMutation.isPending}
                  >
                    {isValidado && !modoEdicao ? "Validado" : "Validar Chegadas"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                                  <Badge variant="outline" className="border-slate-300 text-slate-700 font-medium">
                                    ✓ No Prazo
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-slate-300 text-slate-600 font-medium">
                                    Fora do Prazo
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="outline" className="border-slate-200 text-slate-400 font-medium">
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
                                <Badge variant="outline" className="border-slate-400 text-slate-900 font-semibold">
                                  ✓ Validado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-slate-200 text-slate-400 font-medium">
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleVendedor(vendedor.email)}
                                disabled={!podeEditar}
                                className={`font-medium border-slate-300 hover:bg-slate-100 ${!podeEditar ? "opacity-50 cursor-not-allowed" : ""} ${isValidadoVendedor ? "text-slate-900" : "text-slate-600"}`}
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

                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-500" />
                    <span className="font-semibold text-slate-700 text-base">
                      Total de vendedores validados: <span className="text-slate-900 text-xl font-bold ml-1">{vendedoresValidados.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validação 2º Turno - Apenas Segunda a Sexta */}
          {agora.getDay() !== 6 && agora.getDay() !== 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Validação de Chegada (2º Turno) - {format(new Date(), "dd/MM/yyyy")}</CardTitle>
                    <p className="text-sm text-slate-700 mt-1 font-medium">
                      {horaAtual < horarioDistribuicao2Turno ? (
                        <span className="text-slate-500 font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Disponível a partir de {horarioDistribuicao2Turno}
                        </span>
                      ) : isValidado2Turno ? (
                        <span className="flex items-center gap-2 text-slate-700 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Validado por {getNomeUsuario(validacao2TurnoHoje?.validado_por)} às {validacao2TurnoHoje?.hora_validacao}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Validação pendente</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isValidado2Turno && !modoEdicao2Turno && horaAtual >= horarioDistribuicao2Turno && (
                      <Button
                        variant="outline"
                        onClick={() => setModoEdicao2Turno(true)}
                      >
                        Alterar Validação
                      </Button>
                    )}
                    <Button
                      onClick={validarChegadas2Turno}
                      className="bg-slate-900 hover:bg-slate-800 text-white"
                      disabled={vendedoresValidados2Turno.length === 0 || createValidacaoMutation.isPending || horaAtual < horarioDistribuicao2Turno}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {isValidado2Turno && !modoEdicao2Turno ? "Validado" : "Validar Chegadas"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor/Líder</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">
                          {isValidado2Turno && !modoEdicao2Turno ? "Validado" : "Ação"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendedoresLideres.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                            Nenhum vendedor/líder cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        vendedoresLideres.map(vendedor => {
                          const isValidadoVendedor = vendedoresValidados2Turno.includes(vendedor.email);
                          const podeEditar = (!isValidado2Turno || modoEdicao2Turno) && horaAtual >= horarioDistribuicao2Turno;
                          
                          return (
                            <TableRow key={vendedor.email} className={isValidadoVendedor ? "bg-slate-50/50 border-l-2 border-slate-400" : "hover:bg-slate-50/30"}>
                              <TableCell className="font-medium text-slate-900">
                                {vendedor.full_name || vendedor.email}
                              </TableCell>
                              <TableCell>
                                {isValidadoVendedor ? (
                                  <Badge variant="outline" className="border-slate-400 text-slate-900 font-semibold">
                                    ✓ Validado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-slate-200 text-slate-400 font-medium">
                                    Pendente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleVendedor2Turno(vendedor.email)}
                                  disabled={!podeEditar}
                                  className={`font-medium border-slate-300 hover:bg-slate-100 ${!podeEditar ? "opacity-50 cursor-not-allowed" : ""} ${isValidadoVendedor ? "text-slate-900" : "text-slate-600"}`}
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

                  <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-slate-500" />
                      <span className="font-semibold text-slate-700 text-base">
                        Total de vendedores validados (2º turno): <span className="text-slate-900 text-xl font-bold ml-1">{vendedoresValidados2Turno.length}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                    Vendedores e Performance
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>% Distribuição</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendedoresLideres.map(vendedor => {
                        const percentual = getPercentualVendedor(vendedor.email);
                        return (
                          <TableRow key={vendedor.email}>
                            <TableCell className="font-medium">
                              {vendedor.full_name || vendedor.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold">
                                {percentual}%
                              </Badge>
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

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">

          {/* Percentuais de Distribuição por Vendedor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Percentual de Distribuição por Vendedor
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Define qual percentual da fatia de leads de cada vendedor será efetivamente distribuído. Sobras de vendedores com % &lt; 100% são redistribuídas para vendedores com 100% via round-robin.
                  </p>
                </div>
                <Button
                  onClick={salvarTodosPercentuais}
                  disabled={savingPercentuais}
                  className={savedPercentuais ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}
                >
                  {savingPercentuais ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : savedPercentuais ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Salvo!</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Salvar</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor/Líder</TableHead>
                    <TableHead className="w-48">% de Distribuição</TableHead>
                    <TableHead className="text-slate-500 text-xs font-normal">Leads retornam à fila se &lt; 100%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedoresLideres.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-400 py-8">
                        Nenhum vendedor/líder cadastrado em equipes ativas
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendedoresLideres.map(vendedor => {
                      const percentualAtual = percentuaisEdit[vendedor.email] !== undefined
                        ? percentuaisEdit[vendedor.email]
                        : getPercentualVendedor(vendedor.email);
                      return (
                        <TableRow key={vendedor.email}>
                          <TableCell className="font-medium text-slate-900">
                            {vendedor.full_name || vendedor.email}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={percentualAtual}
                                onChange={(e) => setPercentuaisEdit(prev => ({ ...prev, [vendedor.email]: parseFloat(e.target.value) || 0 }))}
                                className="w-24 text-center"
                              />
                              <span className="text-slate-500 text-sm">%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {percentualAtual < 100 ? (
                              <span className="text-xs text-[#D4A900] font-medium">
                                {100 - percentualAtual}% vai para vendedores com 100%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Recebe sobras dos demais</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Horários */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Horários de Distribuição
                </CardTitle>
                <Button
                  onClick={salvarTodosHorarios}
                  disabled={savingHorarios}
                  className={savedHorarios ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}
                >
                  {savingHorarios ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                  ) : savedHorarios ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Salvo!</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Salvar</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Segunda a Sexta</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Horário Limite Check-in</Label>
                    <Input
                      type="time"
                      value={horariosSemana.limite !== undefined ? horariosSemana.limite : horarioLimiteSemana}
                      onChange={(e) => setHorariosSemana(prev => ({ ...prev, limite: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">
                      Até quando o check-in qualifica o vendedor para receber leads
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Distribuição 1º Turno</Label>
                    <Input
                      type="time"
                      value={horariosSemana.dist1 !== undefined ? horariosSemana.dist1 : horarioDistribuicao1Turno}
                      onChange={(e) => setHorariosSemana(prev => ({ ...prev, dist1: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">
                      Horário que libera o botão de distribuição da manhã
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Distribuição 2º Turno</Label>
                    <Input
                      type="time"
                      value={horariosSemana.dist2 !== undefined ? horariosSemana.dist2 : horarioDistribuicao2Turno}
                      onChange={(e) => setHorariosSemana(prev => ({ ...prev, dist2: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">
                      Horário que libera o botão de distribuição da tarde
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Sábado</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Horário Limite Check-in</Label>
                    <Input
                      type="time"
                      value={horariosSabado.limite !== undefined ? horariosSabado.limite : horarioLimiteSabado}
                      onChange={(e) => setHorariosSabado(prev => ({ ...prev, limite: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">
                      Até quando o check-in qualifica o vendedor para receber leads
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Horário Distribuição</Label>
                    <Input
                      type="time"
                      value={horariosSabado.dist !== undefined ? horariosSabado.dist : horarioDistribuicaoSabado}
                      onChange={(e) => setHorariosSabado(prev => ({ ...prev, dist: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">
                      Horário que libera o botão de distribuição do sábado
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Limite de Leads por Vendedor</Label>
                    <Input
                      type="number"
                      value={horariosSabado.limite_leads !== undefined ? horariosSabado.limite_leads : limiteLeadsSabado}
                      onChange={(e) => setHorariosSabado(prev => ({ ...prev, limite_leads: e.target.value }))}
                      min="1"
                      max="20"
                    />
                    <p className="text-xs text-slate-500">
                      Quantidade fixa de leads por vendedor aos sábados
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regras */}
        <TabsContent value="regras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Como funciona a distribuição de leads
              </CardTitle>
              <p className="text-sm text-slate-500">Descrição completa de todas as regras que o sistema segue ao distribuir leads.</p>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Pré-requisitos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">1. Pré-requisitos para distribuição</h3>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Validação de chegada obrigatória</p>
                      <p className="text-xs text-slate-500 mt-0.5">Antes de distribuir, um líder ou administrador precisa validar quais vendedores estão presentes. Apenas os vendedores validados recebem leads.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Horário liberado</p>
                      <p className="text-xs text-slate-500 mt-0.5">O botão de distribuição só é habilitado após o horário configurado (atualmente: 1º turno às <strong>{horarioDistribuicao1Turno}</strong>, 2º turno às <strong>{horarioDistribuicao2Turno}</strong>, sábado às <strong>{horarioDistribuicaoSabado}</strong>).</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Leads disponíveis na fila</p>
                      <p className="text-xs text-slate-500 mt-0.5">Só é possível distribuir se houver leads não distribuídos aguardando na fila.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Qualificação check-in */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">2. Qualificação pelo check-in</h3>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Horário limite de check-in (seg–sex)</p>
                      <p className="text-xs text-slate-500 mt-0.5">O vendedor precisa fazer check-in até <strong>{horarioLimiteSemana}</strong>. Quem fizer dentro do prazo é marcado como "no prazo" e fica elegível para validação. Quem fizer após esse horário é marcado como "fora do prazo".</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Horário limite de check-in (sábado)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Aos sábados o horário limite é <strong>{horarioLimiteSabado}</strong>. A lógica é a mesma dos dias úteis.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Distribuição seg-sex */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">3. Distribuição de segunda a sexta</h3>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Users className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Divisão igualitária base</p>
                      <p className="text-xs text-slate-500 mt-0.5">O total de leads disponíveis é dividido em fatias iguais entre todos os vendedores validados. Sobras da divisão (leads que não cabem igualmente) ficam na fila para a próxima distribuição.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Percent className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Aplicação do percentual individual</p>
                      <p className="text-xs text-slate-500 mt-0.5">Dentro da fatia de cada vendedor, o sistema distribui apenas o percentual configurado. Por exemplo: se a fatia é de 10 leads e o percentual é 80%, o vendedor recebe 8 leads — os 2 restantes voltam à fila.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Shield className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Redistribuição das sobras entre vendedores com 100%</p>
                      <p className="text-xs text-slate-500 mt-0.5">Os leads que "sobraram" por percentual &lt; 100% são redistribuídos via round-robin entre os vendedores com 100% de distribuição. A ordem do round-robin é embaralhada a cada distribuição para não dar vantagem a ninguém. Se não houver nenhum vendedor com 100%, as sobras permanecem na fila.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <PlayCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Dois turnos por dia</p>
                      <p className="text-xs text-slate-500 mt-0.5">O sistema tem 1º turno (manhã) e 2º turno (tarde). Cada turno exige uma validação de chegada própria. Leads são separados por horário de chegada: os do período da manhã ficam disponíveis no 1º turno e os do período da tarde no 2º turno.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Distribuição sábado */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">4. Distribuição de sábado</h3>
                <div className="space-y-2">
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Limite fixo por vendedor</p>
                      <p className="text-xs text-slate-500 mt-0.5">Aos sábados, cada vendedor recebe exatamente <strong>{limiteLeadsSabado} leads</strong> (independente de percentual). Se não houver leads suficientes, o sistema divide igualmente o que estiver disponível.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <XCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Sem distribuição aos domingos</p>
                      <p className="text-xs text-slate-500 mt-0.5">O sistema bloqueia qualquer distribuição aos domingos.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Distribuição manual */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">5. Distribuição manual</h3>
                <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Send className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Envio avulso para um vendedor específico</p>
                    <p className="text-xs text-slate-500 mt-0.5">Na aba "Distribuição Manual", é possível enviar qualquer quantidade de leads para um vendedor específico a qualquer momento, sem restrição de horário ou validação de chegada.</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}