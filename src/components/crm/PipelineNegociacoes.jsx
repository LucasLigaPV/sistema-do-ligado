import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Phone, Filter, X, Sparkles, MessageCircle, Search, Presentation, Calculator, Handshake, FileCheck, Send, CheckCircle, TrendingDown, AlertCircle, CheckCircle2, XCircle, FileText, Upload, Wrench, FileSignature, CreditCard, Flame, Snowflake, History, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import ModalSubetapas from "./ModalSubetapas";
import FormNovaNegociacao from "./FormNovaNegociacao";
import TimelineEtapas from "./TimelineEtapas";
import DialogAlteracoesNaoSalvas from "./DialogAlteracoesNaoSalvas";
import NavegacaoEtapas from "./NavegacaoEtapas";
import DealCard from "./DealCard";
import AnexosReprova from "./AnexosReprova";
import { useUsuarios } from "../shared/useUsuarios";

export default function PipelineNegociacoes({ userEmail, userFuncao }) {
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editedDeal, setEditedDeal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState({ categoria: "", motivo: "", observacao: "" });
  const [showSubetapaModal, setShowSubetapaModal] = useState(false);
  const [pendingSubetapa, setPendingSubetapa] = useState(null);
  const [selectedSubetapa, setSelectedSubetapa] = useState([]);
  const [showConferenciaModal, setShowConferenciaModal] = useState(false);
  const [conferenciaData, setConferenciaData] = useState(null);
  const [tentouEnviarConferencia, setTentouEnviarConferencia] = useState(false);
  // Filtro de data padrão: 30 dias para trás e 1 dia para frente
  const hoje = new Date();
  const dataInicio = new Date(hoje);
  dataInicio.setDate(dataInicio.getDate() - 30);
  const dataFim = new Date(hoje);
  dataFim.setDate(dataFim.getDate() + 1);
  
  const [startDate, setStartDate] = useState(format(dataInicio, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(dataFim, "yyyy-MM-dd"));
  const [selectedVendedores, setSelectedVendedores] = useState([]);
  const [selectedOrigens, setSelectedOrigens] = useState([]);
  const [origemLogic, setOrigemLogic] = useState("e");
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  
  const [newDeal, setNewDeal] = useState({
    vendedor_email: userEmail,
    etapa: "novo_lead",
    nome_cliente: "",
    telefone: "",
    email: "",
    placa: "",
    modelo_veiculo: "",
    plano_interesse: "",
    origem: "indicacao",
    data_entrada: format(new Date(), "yyyy-MM-dd"),
    hora_entrada: format(new Date(), "HH:mm"),
    valor_mensalidade: "",
    valor_adesao: "",
    plataforma: "",
    posicionamento: "",
    ad: "",
    adset: "",
    campanha: "",
    pagina: ""
  });

  const queryClient = useQueryClient();

  const { data: negociacoes = [], isLoading } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  const { usuarios: users } = useUsuarios();

  // Real-time subscription para Negociacao
  useEffect(() => {
    const unsubscribe = base44.entities.Negociacao.subscribe((event) => {
      queryClient.setQueryData(["negociacoes"], (old) => {
        if (!old) return old;
        
        if (event.type === "create") {
          return [...old, event.data];
        } else if (event.type === "update") {
          return old.map(n => n.id === event.id ? event.data : n);
        } else if (event.type === "delete") {
          return old.filter(n => n.id !== event.id);
        }
        
        return old;
      });
    });

    return unsubscribe;
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Negociacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      setShowNewDeal(false);
      setNewDeal({
        vendedor_email: userEmail,
        etapa: "novo_lead",
        nome_cliente: "",
        telefone: "",
        email: "",
        placa: "",
        modelo_veiculo: "",
        plano_interesse: "",
        origem: "indicacao",
        data_entrada: format(new Date(), "yyyy-MM-dd"),
        hora_entrada: format(new Date(), "HH:mm"),
        valor_mensalidade: "",
        valor_adesao: "",
        plataforma: "",
        posicionamento: "",
        ad: "",
        adset: "",
        campanha: "",
        pagina: ""
      });
    },
  });

  const createVendaMutation = useMutation({
    mutationFn: (data) => base44.entities.Venda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negociacao.update(id, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      
      // Se a negociação foi movida para venda_ativa, criar registro na entidade Venda
      if (data.etapa === "venda_ativa") {
        const negociacao = negociacoes.find(n => n.id === id);
        if (negociacao) {
          // Usar os dados mais recentes do 'data' (garantir origem atualizada)
          const origem = data.origem || negociacao.origem || "lead";
          createVendaMutation.mutate({
            vendedor: data.vendedor_email || negociacao.vendedor_email,
            email_vendedor: data.vendedor_email || negociacao.vendedor_email,
            data_venda: new Date().toISOString().split('T')[0],
            etapa: "pagamento_ok",
            cliente: data.nome_cliente || negociacao.nome_cliente,
            telefone: data.telefone || negociacao.telefone,
            email: data.email || negociacao.email,
            plano_vendido: data.plano_interesse || negociacao.plano_interesse || "essencial",
            placa: data.placa || negociacao.placa || "",
            modelo_veiculo: data.modelo_veiculo || negociacao.modelo_veiculo || "",
            valor_adesao: data.valor_adesao || negociacao.valor_adesao || "",
            valor_mensalidade: data.valor_mensalidade || negociacao.valor_mensalidade || "",
            forma_pagamento: "pix",
            canal_venda: origem,
            tem_indicacao: origem === "indicacao" ? "sim" : "nao",
            observacoes: data.observacoes || negociacao.observacoes || "",
          });
        }
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Negociacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
    },
  });

  const createLossMutation = useMutation({
    mutationFn: (data) => base44.entities.Perda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perdas"] });
    },
  });

  const handleReprovaCorrigida = () => {
    if (!selectedDeal) return;

    const motivosAtualizados = editedDeal.motivos_reprova?.map(m => ({
      ...m,
      corrigido: true
    })) || [];

    updateMutation.mutate({
      id: selectedDeal.id,
      data: {
        etapa: "enviado_cadastro",
        status_aprovacao: "corrigido",
        motivos_reprova: motivosAtualizados,
      },
    });
    setShowDetails(false);
  };

  const handleToggleCorrecao = (index) => {
    if (!selectedDeal || !selectedDeal.motivos_reprova) return;

    const motivosAtualizados = [...selectedDeal.motivos_reprova];
    motivosAtualizados[index] = {
      ...motivosAtualizados[index],
      corrigido: !motivosAtualizados[index].corrigido
    };

    const dealAtualizado = {
      ...selectedDeal,
      motivos_reprova: motivosAtualizados
    };
    setSelectedDeal(dealAtualizado);
    setEditedDeal(dealAtualizado);

    updateMutation.mutate({
      id: selectedDeal.id,
      data: {
        motivos_reprova: motivosAtualizados,
      },
    });
  };

  const todosMotivosCorrigidos = (deal) => {
    if (!deal?.motivos_reprova || deal.motivos_reprova.length === 0) return true;
    return deal.motivos_reprova.every(m => m.corrigido);
  };

  // Verifica se motivos de vistoria existem e se há anexo para eles
  const vistoriaPendenteAnexo = (deal) => {
    if (!deal?.motivos_reprova) return false;
    const temVistoria = deal.motivos_reprova.some(
      m => (m.categoria === "vistoria_fotos" || m.categoria === "vistoria_videos") && !m.corrigido
    );
    if (!temVistoria) return false;
    const temAnexo = (deal.anexos_reprova || []).some(a => !a.expirado);
    return !temAnexo;
  };

  const etapas = [
    { id: "novo_lead", label: "Novo Lead", icon: Sparkles },
    { id: "abordagem", label: "Abordagem", icon: MessageCircle },
    { id: "sondagem", label: "Sondagem", icon: Search },
    { id: "apresentacao", label: "Apresentação", icon: Presentation },
    { id: "cotacao", label: "Cotação", icon: Calculator },
    { id: "em_negociacao", label: "Em Negociação", icon: Handshake },
    { id: "vistoria_assinatura_pix", label: "Vistoria/Assinatura/Pix", icon: FileCheck },
    { id: "enviado_cadastro", label: "Enviado para Cadastro", icon: Send },
    { id: "reprovado", label: "Reprovado", icon: XCircle },
    { id: "venda_ativa", label: "Venda Ativa", icon: CheckCircle },
  ];

  const motivosPerda = {
    financeiro: [
      "Considerou caro",
      "Sem dinheiro no momento",
      "Quer sem valor de entrada",
      "Comprometeu renda na compra do veículo"
    ],
    timing: [
      "Vai analisar",
      "Ainda não possui o veículo",
      "Sem tempo agora",
      "Vai contratar em data futura",
      "Documentação em ajuste",
      "Veículo no mecânico"
    ],
    confianca: [
      "Inseguro com a LIGA",
      "Inseguro com a COBERTURA",
      "Inseguro com o ATENDIMENTO"
    ],
    concorrencia: [
      "Já possui seguro/proteção",
      "Cotando com outras empresas",
      "Perdi para seguradora",
      "Perdi para proteção veicular",
      "Perdi para rastreamento"
    ],
    necessidade: [
      "Deseja somente roubo/furto",
      "Veículo antigo, não vê necessidade",
      "Veículo roda pouco, não vê necessidade"
    ],
    situacoes_esporadicas: [
      "Vendeu o veículo",
      "Não consegui contato",
      "Não solicitou cotação",
      "Bloqueado",
      "Cliente oculto",
      "Erro na Criação da Indicação"
    ],
    lead_invalido: [
      "Veículo sem cobertura",
      "Número Incompleto",
      "Lead Repetido"
    ]
  };

  const origensConfig = {
    lead: { label: "Lead", color: "bg-blue-50 text-blue-700 border-blue-200" },
    indicacao: { label: "Indicação", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    organico: { label: "Orgânico", color: "bg-purple-50 text-purple-700 border-purple-200" },
    troca_titularidade: { label: "Troca Titular", color: "bg-orange-50 text-orange-700 border-orange-200" },
    troca_veiculo: { label: "Troca Veículo", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    segundo_veiculo: { label: "2º Veículo", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    migracao: { label: "Migração", color: "bg-pink-50 text-pink-700 border-pink-200" }
  };

  const formatarTelefone = (tel) => {
    if (!tel) return "";
    const numeros = tel.replace(/\D/g, '');
    return numeros;
  };

  const abrirWhatsApp = (telefone) => {
    const numero = formatarTelefone(telefone);
    window.open(`https://wa.me/55${numero}`, '_blank');
  };

  // Identificar equipe do líder
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail && e.ativa);
  const membrosEquipe = minhaEquipe ? minhaEquipe.membros : [];
  const todosVendedoresEquipe = minhaEquipe ? [minhaEquipe.lider_email, ...membrosEquipe] : [userEmail];

  // Filtrar negociações por acesso
  let negociacoesVisiveis = negociacoes;
  if (userFuncao === "master") {
    negociacoesVisiveis = negociacoes;
  } else if (userFuncao === "lider") {
    negociacoesVisiveis = negociacoes.filter(n => todosVendedoresEquipe.includes(n.vendedor_email));
  } else {
    negociacoesVisiveis = negociacoes.filter(n => n.vendedor_email === userEmail);
  }

  // Aplicar filtros de data
  negociacoesVisiveis = negociacoesVisiveis.filter((neg) => {
    const negDate = neg.data_entrada ? new Date(neg.data_entrada) : new Date(neg.created_date);
    const matchDate = (!startDate || negDate >= new Date(startDate)) && 
                      (!endDate || negDate <= new Date(endDate + "T23:59:59"));
    return matchDate;
  });

  // Aplicar filtro de vendedores
  if ((userFuncao === "lider" || userFuncao === "master") && selectedVendedores.length > 0) {
    negociacoesVisiveis = negociacoesVisiveis.filter(n => selectedVendedores.includes(n.vendedor_email));
  }

  // Aplicar filtro de origem
  if (selectedOrigens.length > 0) {
    negociacoesVisiveis = negociacoesVisiveis.filter(n => {
      const temOrigem = selectedOrigens.includes(n.origem || "lead");
      return origemLogic === "e" ? temOrigem : !temOrigem;
    });
  }

  // Aplicar busca
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    negociacoesVisiveis = negociacoesVisiveis.filter(n => 
      n.nome_cliente?.toLowerCase().includes(query) ||
      n.telefone?.toLowerCase().includes(query) ||
      n.placa?.toLowerCase().includes(query) ||
      n.email?.toLowerCase().includes(query)
    );
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newEtapa = result.destination.droppableId;
    const deal = negociacoes.find(n => n.id === dealId);

    if ((newEtapa === "venda_ativa" || newEtapa === "reprovado") && (userFuncao === "vendedor" || userFuncao === "lider")) {
      alert("Apenas a área de aprovações pode mover vendas para Venda Ativa ou Reprovado!");
      return;
    }

    if (deal?.informacoes_conferidas && deal?.etapa === "enviado_cadastro") {
      alert("Esta venda já foi conferida e está aguardando aprovação. Não pode ser movida.");
      return;
    }

    if (newEtapa === "enviado_cadastro") {
      setConferenciaData({ id: dealId, etapa: newEtapa, ...deal });
      setShowConferenciaModal(true);
    } else if (newEtapa === "vistoria_assinatura_pix") {
      setPendingSubetapa({ id: dealId, etapa: newEtapa, currentSubetapa: deal?.subetapas || [] });
      setSelectedSubetapa(deal?.subetapas || []);
      setShowSubetapaModal(true);
    } else {
       updateMutation.mutate({
         id: dealId,
         data: { ...deal, etapa: newEtapa, subetapas: [] }
       });
     }
  };

  const handleConfirmSubetapa = () => {
    if (selectedSubetapa.length === 0) {
      alert("Por favor, selecione pelo menos uma subetapa");
      return;
    }

    const updatedData = { etapa: pendingSubetapa.etapa, subetapas: selectedSubetapa };
    
    updateMutation.mutate({
      id: pendingSubetapa.id,
      data: updatedData
    });

    if (selectedDeal && selectedDeal.id === pendingSubetapa.id) {
      setSelectedDeal({ ...selectedDeal, ...updatedData });
      setEditedDeal({ ...editedDeal, ...updatedData });
    }

    setShowSubetapaModal(false);
    setPendingSubetapa(null);
    setSelectedSubetapa([]);
  };

  const parseCurrencyValue = (str) => {
    if (!str) return 0;
    const nums = str.replace(/\D/g, '');
    return (parseInt(nums) || 0) / 100;
  };

  const validarConferencia = (data) => {
    if (!data) return {};
    const erros = {};
    const nome = (data.nome_cliente || "").trim();
    if (!nome || nome.split(/\s+/).filter(Boolean).length < 2) erros.nome_cliente = "Preencha o nome completo";
    const tel = (data.telefone || "").replace(/\D/g, '');
    if (tel.length < 11) erros.telefone = "Número incompleto";
    const emailVal = (data.email || "").trim();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) erros.email = "E-mail inválido";
    if (!data.placa || data.placa.replace(/[^A-Z0-9]/g, '').length < 7) erros.placa = "Preencha a placa completa";
    if (!data.modelo_veiculo || !data.modelo_veiculo.trim()) erros.modelo_veiculo = "Preencha o modelo";
    if (!data.plano_interesse) erros.plano_interesse = "Selecione o plano";
    const adesao = parseCurrencyValue(data.valor_adesao);
    if (adesao < 99.99) erros.valor_adesao = "Valor mínimo R$ 99,99";
    const mensalidade = parseCurrencyValue(data.valor_mensalidade);
    if (mensalidade < 50) erros.valor_mensalidade = "Valor mínimo R$ 50,00";
    if (!data.data_vencimento) erros.data_vencimento = "Selecione o dia";
    return erros;
  };

  const handleConferirInformacoes = () => {
    if (!conferenciaData) return;
    setTentouEnviarConferencia(true);
    const erros = validarConferencia(conferenciaData);
    const checklistCompleto = conferenciaData.cadastro_preenchido_power && conferenciaData.documentacoes_enviadas_power && conferenciaData.vistoria_realizada && conferenciaData.contrato_assinado && conferenciaData.pagamento_realizado;
    if (Object.keys(erros).length > 0 || !checklistCompleto) return;

    const updatedData = {
      ...conferenciaData,
      etapa: "enviado_cadastro",
      informacoes_conferidas: true,
      data_conferencia: new Date().toISOString(),
      status_aprovacao: "aguardando"
    };

    updateMutation.mutate({
      id: conferenciaData.id,
      data: updatedData
    });

    if (selectedDeal && selectedDeal.id === conferenciaData.id) {
      setSelectedDeal({ ...selectedDeal, ...updatedData });
      setEditedDeal({ ...editedDeal, ...updatedData });
    }

    setShowConferenciaModal(false);
    setConferenciaData(null);
    setTentouEnviarConferencia(false);
  };

  const handleCreateDeal = (e) => {
    e.preventDefault();
    createMutation.mutate(newDeal);
  };

  const handleUpdateDeal = () => {
    if (!editedDeal || !selectedDeal) return;
    updateMutation.mutate({
      id: selectedDeal.id,
      data: editedDeal
    });
    setShowDetails(false);
    setSelectedDeal(null);
    setEditedDeal(null);
  };

  const handleAdvanceStage = () => {
    if (!selectedDeal) return;
    const currentIndex = etapas.findIndex(e => e.id === selectedDeal.etapa);
    if (currentIndex < etapas.length - 1) {
      const nextEtapa = etapas[currentIndex + 1].id;
      
      if (nextEtapa === "enviado_cadastro") {
        setConferenciaData({
          id: selectedDeal.id,
          etapa: nextEtapa,
          ...editedDeal
        });
        setShowConferenciaModal(true);
      } else if (nextEtapa === "vistoria_assinatura_pix") {
        setPendingSubetapa({ id: selectedDeal.id, etapa: nextEtapa, currentSubetapa: editedDeal?.subetapas || [] });
        setSelectedSubetapa(editedDeal?.subetapas || []);
        setShowSubetapaModal(true);
      } else {
        const updatedData = { ...editedDeal, etapa: nextEtapa, subetapas: [] };
        updateMutation.mutate({
          id: selectedDeal.id,
          data: updatedData
        });
        setSelectedDeal({ ...selectedDeal, ...updatedData });
        setEditedDeal(updatedData);
      }
    }
  };

  const handlePreviousStage = () => {
    if (!selectedDeal) return;
    const currentIndex = etapas.findIndex(e => e.id === selectedDeal.etapa);
    if (currentIndex > 0) {
      const prevEtapa = etapas[currentIndex - 1].id;
      
      if (prevEtapa === "enviado_cadastro") {
        setConferenciaData({
          id: selectedDeal.id,
          etapa: prevEtapa,
          ...editedDeal
        });
        setShowConferenciaModal(true);
      } else if (prevEtapa === "vistoria_assinatura_pix") {
        setPendingSubetapa({ id: selectedDeal.id, etapa: prevEtapa, currentSubetapa: editedDeal?.subetapas || [] });
        setSelectedSubetapa(editedDeal?.subetapas || []);
        setShowSubetapaModal(true);
      } else {
        const updatedData = { ...editedDeal, etapa: prevEtapa, subetapas: [] };
        updateMutation.mutate({
          id: selectedDeal.id,
          data: updatedData
        });
        setSelectedDeal({ ...selectedDeal, ...updatedData });
        setEditedDeal(updatedData);
      }
    }
  };

  const handleMarkAsLoss = () => {
    if (!lossReason.categoria || !lossReason.motivo) {
      alert("Por favor, selecione a categoria e o motivo da perda");
      return;
    }

    const lossData = {
      negociacao_id: selectedDeal.id,
      vendedor_email: selectedDeal.vendedor_email,
      nome_cliente: selectedDeal.nome_cliente,
      telefone: selectedDeal.telefone,
      email: selectedDeal.email || "",
      placa: selectedDeal.placa || "",
      modelo_veiculo: selectedDeal.modelo_veiculo || "",
      plano_interesse: selectedDeal.plano_interesse || "",
      categoria_motivo: lossReason.categoria,
      motivo_perda: lossReason.motivo,
      observacao_perda: lossReason.observacao || "",
      data_perda: format(new Date(), "yyyy-MM-dd"),
      etapa_perda: selectedDeal.etapa,
      valor_adesao: selectedDeal.valor_adesao || "",
      valor_mensalidade: selectedDeal.valor_mensalidade || "",
      origem: selectedDeal.origem || "",
      plataforma: selectedDeal.plataforma || "",
      campanha: selectedDeal.campanha || "",
      data_entrada: selectedDeal.data_entrada || format(new Date(selectedDeal.created_date), "yyyy-MM-dd")
    };

    createLossMutation.mutate(lossData, {
      onSuccess: () => {
        deleteMutation.mutate(selectedDeal.id);
        setShowLossModal(false);
        setShowDetails(false);
        setSelectedDeal(null);
        setEditedDeal(null);
        setLossReason({ categoria: "", motivo: "", observacao: "" });
      }
    });
  };

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.nome_exibicao || user?.full_name || email;
  };

  const vendedoresDisponiveis = userFuncao === "master"
    ? users.filter(u => u.funcao === "lider" || u.funcao === "vendedor").map(u => ({ email: u.email, full_name: u.nome_exibicao || u.full_name || u.email }))
    : todosVendedoresEquipe.map(email => {
        const user = users.find(u => u.email === email);
        return user || { email: email, full_name: email };
      });

  const toggleVendedor = (email) => {
    setSelectedVendedores(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleOrigem = (origem) => {
    setSelectedOrigens(prev => 
      prev.includes(origem) ? prev.filter(o => o !== origem) : [...prev, origem]
    );
  };

  const origensDisponiveis = [
    { value: "lead", label: "Lead" },
    { value: "indicacao", label: "Indicação" },
    { value: "organico", label: "Orgânico" },
    { value: "troca_titularidade", label: "Troca de Titularidade" },
    { value: "troca_veiculo", label: "Troca de Veículo" },
    { value: "segundo_veiculo", label: "Segundo Veículo" },
    { value: "migracao", label: "Migração" }
  ];

  const isEtapaFinal = (etapa) => {
    return ["enviado_cadastro", "reprovado", "venda_ativa"].includes(etapa);
  };

  const handleCardClick = (deal) => {
    setSelectedDeal(deal);
    setEditedDeal({ ...deal });
    setShowDetails(true);
  };

  const hasUnsavedChanges = () => {
    if (!selectedDeal || !editedDeal) return false;
    return JSON.stringify(selectedDeal) !== JSON.stringify(editedDeal);
  };

  const handleCloseDetails = (open) => {
    if (!open && hasUnsavedChanges()) {
      setShowUnsavedChangesDialog(true);
    } else {
      setShowDetails(open);
      if (!open) {
        setSelectedDeal(null);
        setEditedDeal(null);
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    setShowDetails(false);
    setSelectedDeal(null);
    setEditedDeal(null);
  };

  const handleSaveAndClose = () => {
    handleUpdateDeal();
    setShowUnsavedChangesDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Barra lateral fixa com botões */}
      <div className="flex-shrink-0 w-16 flex flex-col gap-3 sticky top-4 self-start">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-16 w-16 flex-col gap-1 p-2 relative" size="sm">
              <Filter className="w-5 h-5" />
              <span className="text-[10px]">Filtros</span>
              {(selectedVendedores.length > 0 || selectedOrigens.length > 0 || startDate || endDate) && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#EFC200] text-black text-xs">
                  {(selectedVendedores.length + selectedOrigens.length) || "•"}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
            <PopoverContent className="w-80" align="start" side="right">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filtros</h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs" />
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Origem</Label>
                  <div className="flex gap-2">
                    <Select value={origemLogic} onValueChange={setOrigemLogic}>
                      <SelectTrigger className="h-9 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="e">É</SelectItem>
                        <SelectItem value="nao_e">Não é</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedOrigens.length > 0 ? "selected" : ""}>
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue placeholder="Selecionar origens...">
                          {selectedOrigens.length > 0 
                            ? `${selectedOrigens.length} selecionada${selectedOrigens.length > 1 ? 's' : ''}`
                            : "Selecionar origens..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {origensDisponiveis.map((origem) => (
                          <div key={origem.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 cursor-pointer">
                            <Checkbox
                              id={`origem-${origem.value}`}
                              checked={selectedOrigens.includes(origem.value)}
                              onCheckedChange={() => toggleOrigem(origem.value)}
                              className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
                            />
                            <label htmlFor={`origem-${origem.value}`} className="text-sm cursor-pointer flex-1">
                              {origem.label}
                            </label>
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedOrigens.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrigens([])} className="w-full text-xs">
                      Limpar Seleção
                    </Button>
                  )}
                </div>

                {(userFuncao === "lider" || userFuncao === "master") && (
                  <div className="space-y-2">
                    <Label className="text-xs">{userFuncao === "master" ? "Vendedores" : "Vendedores da Equipe"}</Label>
                    <Select value={selectedVendedores.length > 0 ? "selected" : ""}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecionar vendedores...">
                          {selectedVendedores.length > 0 
                            ? `${selectedVendedores.length} selecionado${selectedVendedores.length > 1 ? 's' : ''}`
                            : "Selecionar vendedores..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {vendedoresDisponiveis.map((vendedor) => (
                          <div key={vendedor.email} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 cursor-pointer">
                            <Checkbox
                              id={`vendedor-${vendedor.email}`}
                              checked={selectedVendedores.includes(vendedor.email)}
                              onCheckedChange={() => toggleVendedor(vendedor.email)}
                              className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
                            />
                            <label htmlFor={`vendedor-${vendedor.email}`} className="text-sm cursor-pointer flex-1">
                              {vendedor.full_name || vendedor.email}
                            </label>
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedVendedores.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setSelectedVendedores([])} className="w-full text-xs">
                        Limpar Seleção
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        
        <Button 
          onClick={() => setShowNewDeal(true)} 
          className="h-16 w-16 flex-col gap-1 p-2 bg-[#EFC200] hover:bg-[#D4A900] text-black" 
          size="sm"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] leading-tight text-center">Nova</span>
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nome, telefone, placa ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max pb-2">
            {etapas.map((etapa) => {
              const dealsNaEtapa = negociacoesVisiveis.filter(n => n.etapa === etapa.id);
              const IconComponent = etapa.icon;
              const isDropDisabled = etapa.id === "reprovado" || etapa.id === "venda_ativa";
              
              return (
                <Droppable key={etapa.id} droppableId={etapa.id} isDropDisabled={isDropDisabled}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="w-72 sm:w-80 lg:w-96 flex-shrink-0">
                      <Card className="bg-white shadow-sm flex flex-col border" style={{ height: 'calc(100vh - 120px)' }}>
                        <CardHeader className="pb-3 bg-slate-50/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-slate-600" />
                              <CardTitle className="text-sm font-semibold text-slate-700">{etapa.label}</CardTitle>
                            </div>
                            <Badge variant="secondary" className="bg-white border">{dealsNaEtapa.length}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 flex-1 overflow-y-auto">
                            {dealsNaEtapa.map((deal, index) => (
                              <Draggable
                                key={deal.id}
                                draggableId={deal.id}
                                index={index}
                                isDragDisabled={deal.status_aprovacao === "reprovado" || deal.etapa === "enviado_cadastro"}
                              >
                                {(provided, snapshot) => (
                                 <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                   <DealCard
                                     deal={deal}
                                     onClick={() => handleCardClick(deal)}
                                     origensConfig={origensConfig}
                                     formatarTelefone={formatarTelefone}
                                     userFuncao={userFuncao}
                                     getNomeVendedor={getNomeVendedor}
                                   />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Droppable>
              );
            })}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Dialog: Nova Negociação */}
      <FormNovaNegociacao
        open={showNewDeal}
        onOpenChange={setShowNewDeal}
        newDeal={newDeal}
        setNewDeal={setNewDeal}
        onSubmit={handleCreateDeal}
        userFuncao={userFuncao}
      />

      {/* Dialog: Alterações Não Salvas */}
      <DialogAlteracoesNaoSalvas
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveAndClose}
        saveDisabled={selectedDeal?.etapa === "vistoria_assinatura_pix" && (!editedDeal?.subetapas || editedDeal.subetapas.length === 0)}
      />

      {/* Dialog: Detalhes da Negociação */}
      <AnimatePresence>
        {showDetails && selectedDeal && editedDeal && (() => {
          const isReadOnly = isEtapaFinal(selectedDeal.etapa);
          return (
            <Dialog open={showDetails} onOpenChange={handleCloseDetails}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-white to-slate-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-y-auto max-h-[90vh]"
                >
                  <div className="sticky top-0 z-10 bg-white px-8 py-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-1 h-8 bg-[#EFC200] rounded-full"></div>
                          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {editedDeal.modelo_veiculo || "Modelo não informado"}
                          </h2>
                        </div>
                        <p className="text-slate-500 text-sm pl-5">{editedDeal.nome_cliente}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 px-4 py-2 font-medium">
                          {etapas.find(e => e.id === editedDeal.etapa)?.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCloseDetails(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-3 gap-8">
                      {/* Coluna Principal - Abas */}
                      <div className="col-span-2">
                        {/* Navegação de Etapas */}
                        <NavegacaoEtapas
                          etapas={etapas}
                          etapaAtual={editedDeal.etapa}
                          onAvancar={handleAdvanceStage}
                          onVoltar={handlePreviousStage}
                          isEtapaFinal={isEtapaFinal(selectedDeal.etapa)}
                        />

                        {/* Abas Premium */}
                        <Tabs defaultValue="informacoes" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-6 h-14 bg-slate-100/80 p-1.5 rounded-lg">
                            <TabsTrigger value="informacoes" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium h-full flex items-center gap-2 data-[state=active]:text-slate-900 text-slate-600">
                              <FileText className="w-4 h-4" />
                              Informações
                            </TabsTrigger>
                            <TabsTrigger value="negociacao" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium h-full flex items-center gap-2 data-[state=active]:text-slate-900 text-slate-600">
                              <DollarSign className="w-4 h-4" />
                              Negociação
                            </TabsTrigger>
                          </TabsList>

                          {/* Aba 1: Informações */}
                          <TabsContent value="informacoes" className="space-y-5 mt-0">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-5">
                              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Data de Entrada</Label>
                                <p className="text-lg font-semibold text-slate-900 mt-2">
                                  {format(new Date(editedDeal.data_entrada || selectedDeal.created_date), "dd/MM/yyyy")}
                                  {editedDeal.hora_entrada && (
                                    <span className="text-sm font-normal text-slate-500 ml-2">· {editedDeal.hora_entrada}</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Nome do Cliente</Label>
                                <Input
                                  value={editedDeal.nome_cliente}
                                  onChange={(e) => setEditedDeal({ ...editedDeal, nome_cliente: e.target.value })}
                                  maxLength={100}
                                  disabled={isReadOnly}
                                  className="h-11 border-slate-300 focus:border-slate-400 transition-all"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Telefone</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={editedDeal.telefone}
                                    onChange={(e) => {
                                      const numeros = e.target.value.replace(/\D/g, '');
                                      let formatado = numeros;
                                      if (numeros.length <= 11) {
                                        if (numeros.length > 2) {
                                          formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                                        }
                                        if (numeros.length > 7) {
                                          formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                                        }
                                        setEditedDeal({ ...editedDeal, telefone: formatado });
                                      }
                                    }}
                                    placeholder="(11) 00000-0000"
                                    maxLength={15}
                                    disabled={isReadOnly}
                                    className="flex-1 h-11 border-slate-300 focus:border-slate-400 transition-all"
                                  />
                                  {editedDeal.telefone && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      onClick={() => abrirWhatsApp(editedDeal.telefone)}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0 h-11 w-11 shadow-sm"
                                    >
                                      <Phone className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">E-mail</Label>
                                <Input
                                  value={editedDeal.email || ""}
                                  onChange={(e) => setEditedDeal({ ...editedDeal, email: e.target.value })}
                                  disabled={isReadOnly}
                                  className="h-11 border-slate-300 focus:border-slate-400 transition-all"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Placa</Label>
                                <Input
                                  value={editedDeal.placa || ""}
                                  onChange={(e) => {
                                    const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                    let formatado = valor;
                                    if (valor.length > 3) {
                                      formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                                    }
                                    setEditedDeal({ ...editedDeal, placa: formatado });
                                  }}
                                  placeholder="ABC-1D23"
                                  maxLength={8}
                                  disabled={isReadOnly}
                                  className="h-11 border-slate-300 focus:border-slate-400 transition-all"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Modelo do Veículo</Label>
                                <Input
                                  value={editedDeal.modelo_veiculo || ""}
                                  onChange={(e) => setEditedDeal({ ...editedDeal, modelo_veiculo: e.target.value })}
                                  disabled={isReadOnly}
                                  className="h-11 border-slate-300 focus:border-slate-400 transition-all"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Origem</Label>
                                <Select
                                  value={editedDeal.origem || ""}
                                  onValueChange={(value) => setEditedDeal({ ...editedDeal, origem: value })}
                                  disabled={isReadOnly || selectedDeal.origem === "lead"}
                                >
                                  <SelectTrigger disabled={isReadOnly || selectedDeal.origem === "lead"} className="h-11 border-slate-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedDeal.origem === "lead" && (
                                      <SelectItem value="lead">Lead</SelectItem>
                                    )}
                                    <SelectItem value="indicacao">Indicação</SelectItem>
                                    <SelectItem value="organico">Orgânico</SelectItem>
                                    <SelectItem value="troca_titularidade">Troca de Titularidade</SelectItem>
                                    <SelectItem value="troca_veiculo">Troca de Veículo</SelectItem>
                                    <SelectItem value="segundo_veiculo">Segundo Veículo</SelectItem>
                                    <SelectItem value="migracao">Migração</SelectItem>
                                  </SelectContent>
                                </Select>
                                {selectedDeal.origem === "lead" && (
                                  <p className="text-xs text-slate-500 mt-2">Campo travado - negociação distribuída como lead</p>
                                )}
                              </div>
                            </motion.div>
                          </TabsContent>

                          {/* Aba 2: Negociação */}
                          <TabsContent value="negociacao" className="space-y-5 mt-0">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-5">
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Plano</Label>
                                <Select
                                  value={editedDeal.plano_interesse || ""}
                                  onValueChange={(value) => setEditedDeal({ ...editedDeal, plano_interesse: value })}
                                  disabled={isReadOnly}
                                >
                                  <SelectTrigger disabled={isReadOnly} className="h-11 border-slate-300">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="essencial">Essencial</SelectItem>
                                    <SelectItem value="principal">Principal</SelectItem>
                                    <SelectItem value="plano_van">Plano Van</SelectItem>
                                    <SelectItem value="plano_moto">Plano Moto</SelectItem>
                                    <SelectItem value="plano_caminhao">Plano Caminhão</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Valor da Mensalidade</Label>
                                <Input
                                  value={editedDeal.valor_mensalidade || ""}
                                  onChange={(e) => {
                                    const numeros = e.target.value.replace(/\D/g, '');
                                    const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                                    const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    setEditedDeal({ ...editedDeal, valor_mensalidade: formatado });
                                  }}
                                  placeholder="R$ 0,00"
                                  disabled={isReadOnly}
                                  className="h-11 border-slate-300 focus:border-slate-400 transition-all"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Valor da Adesão</Label>
                                <Input
                                  value={editedDeal.valor_adesao || ""}
                                  onChange={(e) => {
                                    const numeros = e.target.value.replace(/\D/g, '');
                                    const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                                    const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    setEditedDeal({ ...editedDeal, valor_adesao: formatado });
                                  }}
                                  placeholder="R$ 0,00"
                                  disabled={isReadOnly}
                                  className="h-11 border-slate-300 focus:border-slate-400 transition-all"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Data de Vencimento</Label>
                                <Select
                                  value={editedDeal.data_vencimento?.toString() || ""}
                                  onValueChange={(value) => setEditedDeal({ ...editedDeal, data_vencimento: parseInt(value) })}
                                  disabled={isReadOnly}
                                >
                                  <SelectTrigger disabled={isReadOnly} className="h-11 border-slate-300">
                                    <SelectValue placeholder="Selecione o dia..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">Dia 05</SelectItem>
                                    <SelectItem value="10">Dia 10</SelectItem>
                                    <SelectItem value="15">Dia 15</SelectItem>
                                    <SelectItem value="20">Dia 20</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Observações / Anotações</Label>
                                <Textarea
                                  value={editedDeal.observacoes || ""}
                                  onChange={(e) => setEditedDeal({ ...editedDeal, observacoes: e.target.value })}
                                  placeholder="Anote informações úteis sobre esta negociação..."
                                  rows={4}
                                  disabled={isReadOnly}
                                  className="border-slate-300 focus:border-slate-400 transition-all resize-none"
                                />
                              </div>

                              {selectedDeal.etapa === "vistoria_assinatura_pix" && (
                                <div className="bg-amber-50/50 rounded-xl p-5 border-2 border-amber-200">
                                  <Label className="text-sm font-semibold text-amber-900 mb-3 block flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Aguardando *
                                  </Label>
                                  <div className="space-y-3">
                                    {["aguardando_vistoria", "aguardando_assinatura", "aguardando_pix"].map((sub) => (
                                      <div key={sub} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-300 transition-colors">
                                        <Checkbox
                                          id={`sub-${sub}`}
                                          checked={(editedDeal.subetapas || []).includes(sub)}
                                          onCheckedChange={(checked) => {
                                            const newSubetapas = checked
                                              ? [...(editedDeal.subetapas || []), sub]
                                              : (editedDeal.subetapas || []).filter(s => s !== sub);
                                            setEditedDeal({ ...editedDeal, subetapas: newSubetapas });
                                          }}
                                          disabled={isReadOnly}
                                          className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
                                        />
                                        <label htmlFor={`sub-${sub}`} className="text-sm font-medium cursor-pointer flex-1 text-slate-700">
                                          {sub === "aguardando_vistoria" && "Aguardando Vistoria"}
                                          {sub === "aguardando_assinatura" && "Aguardando Assinatura"}
                                          {sub === "aguardando_pix" && "Aguardando Pix"}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                  {(!editedDeal.subetapas || editedDeal.subetapas.length === 0) && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-3 bg-red-50 p-2 rounded-lg">
                                      <AlertCircle className="w-4 h-4" />
                                      <span>Selecione pelo menos uma opção</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Coluna Lateral */}
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
                        {/* Info do Consultor */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-6 border border-slate-200 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-5 bg-[#EFC200] rounded-full"></div>
                            Consultor Responsável
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</Label>
                              <p className="text-base font-semibold text-slate-900 mt-2">
                                {getNomeVendedor(selectedDeal.vendedor_email)}
                              </p>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail</Label>
                              <p className="text-sm text-slate-600 mt-2 break-words">
                                {selectedDeal.vendedor_email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Temperatura */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-6 border border-slate-200 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-5 bg-[#EFC200] rounded-full"></div>
                            Temperatura
                          </h3>
                          <Select 
                            value={editedDeal.temperatura || ""} 
                            onValueChange={(value) => setEditedDeal({ ...editedDeal, temperatura: value })}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-11 border-slate-300">
                              <SelectValue placeholder="Selecionar...">
                                {editedDeal.temperatura === "quente" && (
                                  <span className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    Quente
                                  </span>
                                )}
                                {editedDeal.temperatura === "frio" && (
                                  <span className="flex items-center gap-2">
                                    <Snowflake className="w-4 h-4 text-blue-400" />
                                    Frio
                                  </span>
                                )}
                                {!editedDeal.temperatura && "Selecionar..."}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quente">
                                <span className="flex items-center gap-2">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  Quente
                                </span>
                              </SelectItem>
                              <SelectItem value="frio">
                                <span className="flex items-center gap-2">
                                  <Snowflake className="w-4 h-4 text-blue-400" />
                                  Frio
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Timeline de Etapas */}
                        <TimelineEtapas
                          etapas={etapas}
                          etapaAtual={editedDeal.etapa}
                          isReadOnly={isEtapaFinal(selectedDeal.etapa) || selectedDeal.etapa === "reprovado"}
                          onEtapaClick={(novaEtapa) => {
                            if (novaEtapa === "enviado_cadastro") {
                              setConferenciaData({
                                id: selectedDeal.id,
                                etapa: novaEtapa,
                                ...editedDeal
                              });
                              setShowConferenciaModal(true);
                            } else if (novaEtapa === "vistoria_assinatura_pix") {
                              setPendingSubetapa({ 
                                id: selectedDeal.id, 
                                etapa: novaEtapa, 
                                currentSubetapa: editedDeal?.subetapas || [] 
                              });
                              setSelectedSubetapa(editedDeal?.subetapas || []);
                              setShowSubetapaModal(true);
                            } else {
                              const updatedData = { ...editedDeal, etapa: novaEtapa, subetapas: [] };
                              updateMutation.mutate({
                                id: selectedDeal.id,
                                data: updatedData
                              });
                              setSelectedDeal({ ...selectedDeal, etapa: novaEtapa, subetapas: [] });
                              setEditedDeal(updatedData);
                            }
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* Botões de Ação */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col gap-4 pt-6 mt-6 border-t border-slate-200">
                {isEtapaFinal(selectedDeal.etapa) && (
                   <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                     {selectedDeal.etapa === "enviado_cadastro" && "⚠️ Esta venda está aguardando aprovação do time de aprovações. Visualização apenas."}
                     {selectedDeal.status_aprovacao === "reprovado" && (
                       <div className="space-y-2">
                         <p className="font-semibold">❌ Esta venda foi reprovada pelo time de aprovações.</p>
                         <p className="text-xs mt-2 pt-2 border-t border-amber-300">Corrija os pontos acima e clique em "Reprova Corrigida" após as alterações.</p>
                       </div>
                     )}
                     {selectedDeal.etapa === "venda_ativa" && "✅ Esta venda já está ativa. A placa está em processo de ativação."}
                   </div>
                 )}

                {selectedDeal.etapa === "reprovado" && (() => {
                  const historicoReprov = selectedDeal.historico_reprovas || [];
                  
                  const categoriesMotivo = {
                    documentacao: "Documentação",
                    contrato: "Contrato",
                    vistoria_fotos: "Vistoria - Fotos",
                    vistoria_videos: "Vistoria - Vídeos",
                    preenchimento: "Preenchimento",
                  };

                  return (
                    <>
                      {selectedDeal.motivos_reprova && selectedDeal.motivos_reprova.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Pendências a Corrigir
                          </h3>
                          <AnexosReprova
                            negociacao={selectedDeal}
                            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["negociacoes"] })}
                            readOnly={false}
                          />

                          <div className="space-y-2.5 mb-4 mt-3">
                            {selectedDeal.motivos_reprova.map((motivo, index) => (
                              <div 
                                key={index}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-all border ${
                                  motivo.corrigido 
                                    ? "bg-green-50 border-green-200" 
                                    : "bg-red-50 border-red-200"
                                }`}
                              >
                                <Checkbox
                                  checked={motivo.corrigido || false}
                                  onCheckedChange={() => handleToggleCorrecao(index)}
                                  className={`flex-shrink-0 mt-0.5 ${motivo.corrigido ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" : "data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"}`}
                                />
                                <div className="flex-1">
                                  <p className={`text-sm font-semibold ${motivo.corrigido ? "text-green-700 line-through" : "text-red-700"}`}>
                                    {categoriesMotivo[motivo.categoria]}
                                  </p>
                                  <p className={`text-xs mt-1 ${motivo.corrigido ? "text-green-600 line-through" : "text-red-600"}`}>
                                    {motivo.detalhe}
                                  </p>
                                </div>
                                {motivo.corrigido && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Histórico de Reprovas */}
                      {historicoReprov.length > 1 && (
                        <div className="border-t pt-4">
                          <Button variant="ghost" size="sm" onClick={() => setShowHistorico(!showHistorico)} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 mb-3">
                            <History className="w-4 h-4" />
                            <span className="text-xs">Exibir Outras Reprovas</span>
                            {showHistorico ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                          
                          {showHistorico && (
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                              {historicoReprov.slice(1).map((sessao, sessaoIndex) => (
                                <div key={`${sessao.data_analise}-${sessaoIndex}`} className="space-y-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-xs text-slate-500 font-medium">
                                      {format(new Date(sessao.data_analise), "dd/MM/yyyy 'às' HH:mm")}
                                    </span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                  </div>
                                  
                                  <div className="rounded-lg p-3 space-y-2 border bg-slate-50 border-slate-200">
                                    {sessao.motivos && sessao.motivos.length > 0 && (
                                      <div className="space-y-2">
                                        {sessao.motivos.map((motivo, idx) => (
                                          <div key={idx} className="bg-white rounded p-2">
                                            <p className="text-xs font-semibold text-slate-700">
                                              {categoriesMotivo[motivo.categoria]}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-1">{motivo.detalhe}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Button
                        onClick={handleReprovaCorrigida}
                        disabled={!todosMotivosCorrigidos(selectedDeal) || vistoriaPendenteAnexo(selectedDeal)}
                        className={`w-full ${todosMotivosCorrigidos(selectedDeal) && !vistoriaPendenteAnexo(selectedDeal) ? "bg-green-600 hover:bg-green-700" : "bg-slate-300 cursor-not-allowed"} text-white`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {!todosMotivosCorrigidos(selectedDeal)
                          ? "Marque Todas as Correções"
                          : vistoriaPendenteAnexo(selectedDeal)
                          ? "Anexe o arquivo de vistoria"
                          : "Pendências Corrigidas - Enviar"}
                      </Button>
                    </>
                  );
                })()}

                      {!isEtapaFinal(selectedDeal.etapa) && (
                        <Button
                          onClick={handleUpdateDeal}
                          disabled={selectedDeal.etapa === "vistoria_assinatura_pix" && (!editedDeal.subetapas || editedDeal.subetapas.length === 0)}
                          className="w-full h-12 bg-[#EFC200] hover:bg-[#D4A900] text-black font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Salvar Alterações
                        </Button>
                      )}

                      {!isEtapaFinal(selectedDeal.etapa) && (
                        <Button onClick={() => setShowLossModal(true)} variant="destructive" className="w-full h-12 font-semibold shadow-md hover:shadow-lg transition-all">
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Marcar como Perda
                        </Button>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          );
        })()}
      </AnimatePresence>

      {/* Modal: Conferência de Informações */}
      <Dialog open={showConferenciaModal} onOpenChange={(v) => { setShowConferenciaModal(v); if (!v) setTentouEnviarConferencia(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conferir Informações da Venda</DialogTitle>
          </DialogHeader>
          {conferenciaData && (() => {
            const erros = tentouEnviarConferencia ? validarConferencia(conferenciaData) : {};
            const checklistCompleto = conferenciaData.cadastro_preenchido_power && conferenciaData.documentacoes_enviadas_power && conferenciaData.vistoria_realizada && conferenciaData.contrato_assinado && conferenciaData.pagamento_realizado;
            const FieldError = ({ campo }) => erros[campo] ? (
              <div className="flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-500 font-medium">{erros[campo]}</span>
              </div>
            ) : null;
            return (
              <div className="space-y-6">
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 mb-1">ATENÇÃO!</p>
                      <p className="text-sm text-amber-800">
                        Um erro nesta etapa pode comprometer a ativação e status da sua venda. Muita atenção!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#EFC200]" />
                    Checklist de Envio
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { key: "cadastro_preenchido_power", label: "Preencheu Cadastro na Power", icon: FileText },
                      { key: "documentacoes_enviadas_power", label: "Subiu as Documentações na Power", icon: Upload },
                      { key: "vistoria_realizada", label: "Vistoria Realizada", icon: Wrench },
                      { key: "contrato_assinado", label: "Contrato Assinado", icon: FileSignature },
                      { key: "pagamento_realizado", label: "Pagamento Realizado", icon: CreditCard }
                    ].map((item) => {
                      const IconComponent = item.icon;
                      const isChecked = conferenciaData[item.key] || false;
                      const showChecklistError = tentouEnviarConferencia && !checklistCompleto && !isChecked;
                      return (
                        <div
                          key={item.key}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                            isChecked ? "bg-green-50 border border-green-200" : showChecklistError ? "bg-red-50 border border-red-200" : "bg-white border border-slate-200 hover:border-slate-300"
                          }`}
                          onClick={() => setConferenciaData({ ...conferenciaData, [item.key]: !isChecked })}
                        >
                          <Checkbox
                            checked={isChecked}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={(checked) => setConferenciaData({ ...conferenciaData, [item.key]: checked })}
                            className={`data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] flex-shrink-0 ${isChecked ? "ring-2 ring-[#EFC200]" : ""}`}
                          />
                          <IconComponent className={`w-4 h-4 flex-shrink-0 ${isChecked ? "text-green-600" : showChecklistError ? "text-red-400" : "text-slate-400"}`} />
                          <span className={`text-sm flex-1 font-medium ${isChecked ? "text-green-700" : showChecklistError ? "text-red-600" : "text-slate-700"}`}>
                            {item.label}
                          </label>
                          {isChecked && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                          {showChecklistError && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={erros.nome_cliente ? "text-red-600" : ""}>Nome do Cliente *</Label>
                    <Input
                      value={conferenciaData.nome_cliente || ""}
                      onChange={(e) => setConferenciaData({ ...conferenciaData, nome_cliente: e.target.value })}
                      className={erros.nome_cliente ? "border-red-400 focus:border-red-500" : ""}
                    />
                    <FieldError campo="nome_cliente" />
                  </div>
                  <div>
                    <Label className={erros.telefone ? "text-red-600" : ""}>Telefone *</Label>
                    <Input
                      value={conferenciaData.telefone || ""}
                      onChange={(e) => {
                        const numeros = e.target.value.replace(/\D/g, '');
                        let formatado = numeros;
                        if (numeros.length <= 11) {
                          if (numeros.length > 2) formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                          if (numeros.length > 7) formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                          setConferenciaData({ ...conferenciaData, telefone: formatado });
                        }
                      }}
                      placeholder="(11) 00000-0000"
                      maxLength={15}
                      className={erros.telefone ? "border-red-400 focus:border-red-500" : ""}
                    />
                    <FieldError campo="telefone" />
                  </div>
                  <div>
                    <Label className={erros.email ? "text-red-600" : ""}>E-mail *</Label>
                    <Input
                      type="email"
                      value={conferenciaData.email || ""}
                      onChange={(e) => setConferenciaData({ ...conferenciaData, email: e.target.value })}
                      className={erros.email ? "border-red-400 focus:border-red-500" : ""}
                    />
                    <FieldError campo="email" />
                  </div>
                  <div>
                    <Label className={erros.placa ? "text-red-600" : ""}>Placa *</Label>
                    <Input
                      value={conferenciaData.placa || ""}
                      onChange={(e) => {
                        const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        let formatado = valor;
                        if (valor.length > 3) formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                        setConferenciaData({ ...conferenciaData, placa: formatado });
                      }}
                      placeholder="ABC-1D23"
                      maxLength={8}
                      className={erros.placa ? "border-red-400 focus:border-red-500" : ""}
                    />
                    <FieldError campo="placa" />
                  </div>
                  <div>
                    <Label className={erros.modelo_veiculo ? "text-red-600" : ""}>Modelo do Veículo *</Label>
                    <Input
                      value={conferenciaData.modelo_veiculo || ""}
                      onChange={(e) => setConferenciaData({ ...conferenciaData, modelo_veiculo: e.target.value })}
                      placeholder="Ex: FIAT ARGO 1.0 2023"
                      className={`mt-1 ${erros.modelo_veiculo ? "border-red-400 focus:border-red-500" : ""}`}
                    />
                    <FieldError campo="modelo_veiculo" />
                  </div>
                  <div>
                    <Label className={erros.plano_interesse ? "text-red-600" : ""}>Plano *</Label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md ${erros.plano_interesse ? "border-red-400" : "border-slate-300"}`}
                      value={conferenciaData.plano_interesse || ""}
                      onChange={(e) => setConferenciaData({ ...conferenciaData, plano_interesse: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="essencial">Essencial</option>
                      <option value="principal">Principal</option>
                      <option value="plano_van">Plano Van</option>
                      <option value="plano_moto">Plano Moto</option>
                      <option value="plano_caminhao">Plano Caminhão</option>
                    </select>
                    <FieldError campo="plano_interesse" />
                  </div>
                  <div>
                    <Label className={erros.valor_adesao ? "text-red-600" : ""}>Valor da Adesão * <span className="text-xs font-normal text-slate-400">(mín. R$ 99,99)</span></Label>
                    <Input
                      value={conferenciaData.valor_adesao || ""}
                      onChange={(e) => {
                        const numeros = e.target.value.replace(/\D/g, '');
                        const valor = Math.min((parseInt(numeros) || 0) / 100, 9999);
                        const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        setConferenciaData({ ...conferenciaData, valor_adesao: formatado });
                      }}
                      placeholder="R$ 0,00"
                      className={erros.valor_adesao ? "border-red-400 focus:border-red-500" : ""}
                    />
                    <FieldError campo="valor_adesao" />
                  </div>
                  <div>
                    <Label className={erros.valor_mensalidade ? "text-red-600" : ""}>Valor da Mensalidade *</Label>
                    <Input
                      value={conferenciaData.valor_mensalidade || ""}
                      onChange={(e) => {
                        const numeros = e.target.value.replace(/\D/g, '');
                        const valor = Math.min((parseInt(numeros) || 0) / 100, 9999);
                        const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        setConferenciaData({ ...conferenciaData, valor_mensalidade: formatado });
                      }}
                      placeholder="R$ 0,00"
                      className={erros.valor_mensalidade ? "border-red-400 focus:border-red-500" : ""}
                    />
                    <FieldError campo="valor_mensalidade" />
                  </div>
                  <div>
                    <Label className={erros.data_vencimento ? "text-red-600" : ""}>Data de Vencimento *</Label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md ${erros.data_vencimento ? "border-red-400" : "border-slate-300"}`}
                      value={conferenciaData.data_vencimento?.toString() || ""}
                      onChange={(e) => setConferenciaData({ ...conferenciaData, data_vencimento: parseInt(e.target.value) || null })}
                    >
                      <option value="">Selecione o dia...</option>
                      <option value="5">Dia 05</option>
                      <option value="10">Dia 10</option>
                      <option value="15">Dia 15</option>
                      <option value="20">Dia 20</option>
                    </select>
                    <FieldError campo="data_vencimento" />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea value={conferenciaData.observacoes || ""} onChange={(e) => setConferenciaData({ ...conferenciaData, observacoes: e.target.value })} rows={3} />
                  </div>
                </div>

                {tentouEnviarConferencia && (Object.keys(erros).length > 0 || !checklistCompleto) && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-600 font-medium">Corrija os campos marcados antes de prosseguir.</span>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleConferirInformacoes}
                    className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Informações Conferidas
                  </Button>
                </div>

                <p className="text-center text-sm text-amber-700 font-medium">
                  Um erro nesta etapa pode comprometer a ativação e status da sua venda, muita atenção!
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal: Subetapa */}
      <ModalSubetapas
        open={showSubetapaModal}
        onOpenChange={setShowSubetapaModal}
        selectedSubetapa={selectedSubetapa}
        setSelectedSubetapa={setSelectedSubetapa}
        onConfirm={handleConfirmSubetapa}
        onCancel={() => {
          setShowSubetapaModal(false);
          setPendingSubetapa(null);
          setSelectedSubetapa([]);
        }}
      />

      {/* Modal: Acesso Negado */}
      <Dialog open={showAccessDeniedModal} onOpenChange={setShowAccessDeniedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Acesso Limitado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{accessDeniedReason}</p>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  setShowAccessDeniedModal(false);
                  setShowDetails(false);
                  setSelectedDeal(null);
                  setEditedDeal(null);
                }}
                className="flex-1 bg-[#EFC200] hover:bg-[#D4A900] text-black"
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Motivo da Perda */}
      <Dialog open={showLossModal} onOpenChange={setShowLossModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Perda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria do Motivo *</Label>
              <Select value={lossReason.categoria} onValueChange={(value) => setLossReason({ ...lossReason, categoria: value, motivo: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="timing">Timing/Momento</SelectItem>
                  <SelectItem value="confianca">Confiança</SelectItem>
                  <SelectItem value="concorrencia">Concorrência</SelectItem>
                  <SelectItem value="necessidade">Necessidade/Produto</SelectItem>
                  <SelectItem value="situacoes_esporadicas">Situações Esporádicas</SelectItem>
                  <SelectItem value="lead_invalido">Lead Inválido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lossReason.categoria && (
              <div>
                <Label>Motivo Específico *</Label>
                <Select value={lossReason.motivo} onValueChange={(value) => setLossReason({ ...lossReason, motivo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosPerda[lossReason.categoria]?.map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>{motivo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Observação Adicional</Label>
              <Textarea
                value={lossReason.observacao}
                onChange={(e) => setLossReason({ ...lossReason, observacao: e.target.value })}
                placeholder="Detalhes adicionais sobre a perda..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setShowLossModal(false);
                setLossReason({ categoria: "", motivo: "", observacao: "" });
              }} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleMarkAsLoss} variant="destructive" className="flex-1" disabled={!lossReason.categoria || !lossReason.motivo}>
                Confirmar Perda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}