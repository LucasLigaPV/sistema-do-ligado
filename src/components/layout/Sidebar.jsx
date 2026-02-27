import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  UserPlus,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trophy,
  Megaphone,
  ChevronDown,
  Briefcase,
  UsersRound,
  Handshake,
  CheckCircle,
  Inbox,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function Sidebar({ user, activeMenu, onMenuChange, onOpenCheckin }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [crmExpanded, setCrmExpanded] = useState(false);
  const [controleExpanded, setControleExpanded] = useState(false);
  const [aprovacoesExpanded, setAprovacoesExpanded] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: checkins = [] } = useQuery({
    queryKey: ["checkins", user?.email],
    queryFn: () => base44.entities.Checkin.list(),
    enabled: !!user?.email,
  });

  const { data: configs = [] } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => base44.entities.ConfiguracaoDistribuicao.list(),
  });

  const createCheckinMutation = useMutation({
    mutationFn: (data) => base44.entities.Checkin.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      setShowCheckinModal(false);
    },
  });

  // Verificar se já fez check-in hoje
  const hoje = format(new Date(), "yyyy-MM-dd");
  const checkinHoje = checkins.find(
    (c) => c.usuario_email === user?.email && c.data === hoje
  );

  const handleCheckin = () => {
    const agora = new Date();
    const hora = format(agora, "HH:mm");
    const data = format(agora, "yyyy-MM-dd");
    const diaSemana = agora.toLocaleDateString('pt-BR', { weekday: 'long' });
    
    // Buscar horários das configurações
    const horarioSemanaConfig = configs.find(c => c.tipo === "horario_limite_semana");
    const horarioSabadoConfig = configs.find(c => c.tipo === "horario_limite_sabado");
    
    const horarioLimiteSemana = horarioSemanaConfig?.valor || "10:31";
    const horarioLimiteSabado = horarioSabadoConfig?.valor || "10:30";
    
    // Verificar se está dentro do prazo
    const [horaAtual, minutoAtual] = hora.split(":").map(Number);
    const isDomingo = agora.getDay() === 0;
    const isSabado = agora.getDay() === 6;
    
    let dentroPrazo = false;
    if (!isDomingo) {
      if (isSabado) {
        const [limiteHora, limiteMinuto] = horarioLimiteSabado.split(":").map(Number);
        dentroPrazo = horaAtual < limiteHora || (horaAtual === limiteHora && minutoAtual <= limiteMinuto);
      } else {
        const [limiteHora, limiteMinuto] = horarioLimiteSemana.split(":").map(Number);
        dentroPrazo = horaAtual < limiteHora || (horaAtual === limiteHora && minutoAtual <= limiteMinuto);
      }
    }

    createCheckinMutation.mutate({
      usuario_email: user?.email,
      data,
      hora,
      dentro_prazo: dentroPrazo,
      dia_semana: diaSemana,
    });
  };

  const menuItems = [
    { id: "inicio", label: "Início", icon: Home, link: "/Inicio" },
    { 
      id: "controle", 
      label: "Controle", 
      icon: Briefcase, 
      hasSubmenu: true,
      submenus: [
        { id: "vendas", label: "Vendas", icon: DollarSign },
        { id: "indicacoes", label: "Indicações", icon: UserPlus },
      ]
    },
    { 
      id: "crm", 
      label: "CRM", 
      icon: Users, 
      hasSubmenu: true,
      submenus: [
        ...(user?.funcao === "master" ? [{ id: "crm-leads", label: "Fila de Leads", icon: Users, description: "Kanban" }] : []),
        { id: "crm-negociacoes", label: "Negociações", icon: Handshake },
        { id: "crm-perdas", label: "Perdas", icon: TrendingDown },
        ...(user?.funcao === "lider" || user?.funcao === "master" ? [{ id: "crm-distribuicao", label: "Distribuição", icon: TrendingUp }] : []),
        { id: "crm-dashboard", label: "Dashboard", icon: BarChart3 },
      ]
    },
    ...(user?.funcao === "master" ? [{ id: "crm-marketing", label: "Marketing", icon: Megaphone }] : []),
    ...(user?.funcao === "master" ? [{ 
      id: "aprovacoes", 
      label: "Aprovações", 
      icon: CheckCircle,
      hasSubmenu: true,
      submenus: [
        { id: "aprovacoes-avaliar", label: "Avaliar", icon: CheckCircle },
        { id: "aprovacoes-dashboard", label: "Dashboard", icon: BarChart3 },
      ]
    }] : []),
    { id: "rankings", label: "Rankings", icon: Trophy },
    ...((user?.role === "admin" || user?.funcao === "master") ? [{ id: "configuracoes", label: "Usuários e Equipes", icon: UsersRound }] : []),
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e47847403553d35324f72/c31703845_SimplePretoeAmarelo.png"
            alt="Liga"
            className="h-8 w-auto"
          />
        </div>
        <span className="text-sm text-slate-600 truncate max-w-[150px]">
          {user?.full_name || user?.email}
        </span>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={toggleMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 256 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-white border-r shadow-sm fixed left-0 top-0 h-screen z-30"
      >
        {/* Logo Section */}
        <div className="p-4 border-b flex items-center justify-between">
          {isOpen ? (
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e47847403553d35324f72/c31703845_SimplePretoeAmarelo.png"
              alt="Liga"
              className="h-10 w-auto"
            />
          ) : (
            <div className="w-10 h-10 bg-[#EFC200] rounded-lg flex items-center justify-center text-black font-bold text-xl">
              L
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white border shadow-md rounded-full w-6 h-6 hover:bg-slate-50 z-50"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            if (item.link) {
              return (
                <Link key={item.id} to={item.link}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 hover:bg-slate-100"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span>{item.label}</span>}
                  </Button>
                </Link>
              );
            }
            
            if (item.hasSubmenu) {
              const isExpanded = item.id === "crm" ? crmExpanded : item.id === "controle" ? controleExpanded : aprovacoesExpanded;
              const toggleExpanded = item.id === "crm" 
                ? () => setCrmExpanded(!crmExpanded) 
                : item.id === "controle"
                ? () => setControleExpanded(!controleExpanded)
                : () => setAprovacoesExpanded(!aprovacoesExpanded);
              
              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 hover:bg-slate-100 ${!isOpen ? "justify-center" : ""}`}
                    onClick={toggleExpanded}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </>
                    )}
                  </Button>
                  <AnimatePresence>
                    {isExpanded && isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                          {item.submenus.map((submenu) => {
                            const SubmenuIcon = submenu.icon;
                            const isSubmenuActive = activeMenu === submenu.id;
                            return (
                              <Button
                                key={submenu.id}
                                variant={isSubmenuActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-2 text-sm h-9 ${
                                  isSubmenuActive ? "bg-[#EFC200] hover:bg-[#D4A900] text-black" : "text-slate-600"
                                }`}
                                onClick={() => onMenuChange(submenu.id)}
                              >
                                <SubmenuIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{submenu.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isActive ? "bg-[#EFC200] hover:bg-[#D4A900] text-black" : ""
                } ${!isOpen ? "justify-center" : ""}`}
                onClick={() => onMenuChange(item.id)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t space-y-2">
          {checkinHoje ? (
            <div className={`px-3 py-2 mb-2 rounded-lg ${
              checkinHoje.dentro_prazo 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            } ${!isOpen ? "text-center" : ""}`}>
              {isOpen ? (
                <div className={`flex items-center justify-center gap-2 ${
                  checkinHoje.dentro_prazo ? "text-green-700" : "text-red-700"
                }`}>
                  {checkinHoje.dentro_prazo ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <p className="text-xs font-semibold">
                    {checkinHoje.dentro_prazo ? "Pronto para Leads" : "Fora do horário"}
                  </p>
                </div>
              ) : (
                checkinHoje.dentro_prazo ? (
                  <CheckCircle className="w-5 h-5 mx-auto text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 mx-auto text-red-600" />
                )
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              className={`w-full gap-3 hover:bg-slate-100 ${
                !isOpen ? "justify-center" : "justify-between"
              }`}
              onClick={() => onOpenCheckin && onOpenCheckin()}
              >
                <div className="flex items-center gap-3">
                  <Inbox className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span>Receber Leads</span>}
                </div>
              {isOpen && (
                <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <span className="text-white text-xs font-bold">!</span>
                </span>
              )}
              {!isOpen && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg" />
              )}
            </Button>
          )}
          
          {isOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-slate-500">{user?.role === "admin" ? "Administrador" : "Usuário"}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className={`w-full gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 ${
              !isOpen ? "justify-center" : "justify-start"
            }`}
            onClick={() => {
              if (window.confirm("Deseja realmente sair?")) {
                window.location.href = "/";
              }
            }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span>Sair</span>}
          </Button>
        </div>

        {/* Modal de Check-in */}
        {showCheckinModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  Recepção de Leads
                </h2>
                <button
                  onClick={() => setShowCheckinModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-slate-600 text-lg">
                    {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: { localize: { month: (n) => ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][n] } } })}
                  </p>
                  <p className="text-4xl font-bold text-[#EFC200]">
                    {format(new Date(), "HH:mm")}
                  </p>
                </div>
                <p className="text-slate-600">
                  Registre sua presença para receber leads hoje
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-medium mb-2">⏰ Horários Limite:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Segunda a Sexta: <strong>{configs.find(c => c.tipo === "horario_limite_semana")?.valor || "10:31"}</strong></li>
                  <li>• Sábado: <strong>{configs.find(c => c.tipo === "horario_limite_sabado")?.valor || "10:30"}</strong></li>
                  <li>• Domingo: Sem distribuição</li>
                </ul>
              </div>

              <Button
                onClick={handleCheckin}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                disabled={createCheckinMutation.isPending}
              >
                {createCheckinMutation.isPending ? (
                  "Registrando..."
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Pronto para receber Leads
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Logo */}
            <div className="p-4 border-b flex items-center justify-between">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e47847403553d35324f72/c31703845_SimplePretoeAmarelo.png"
                alt="Liga"
                className="h-10 w-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileSidebar}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-3 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                
                if (item.link) {
                  return (
                    <Link key={item.id} to={item.link}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 hover:bg-slate-100"
                        onClick={toggleMobileSidebar}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                }
                
                if (item.hasSubmenu) {
                  const isExpanded = item.id === "crm" ? crmExpanded : item.id === "controle" ? controleExpanded : aprovacoesExpanded;
                  const toggleExpanded = item.id === "crm" 
                    ? () => setCrmExpanded(!crmExpanded) 
                    : item.id === "controle"
                    ? () => setControleExpanded(!controleExpanded)
                    : () => setAprovacoesExpanded(!aprovacoesExpanded);
                  
                  return (
                    <div key={item.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 hover:bg-slate-100"
                        onClick={toggleExpanded}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </Button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                              {item.submenus.map((submenu) => {
                                const SubmenuIcon = submenu.icon;
                                const isSubmenuActive = activeMenu === submenu.id;
                                return (
                                  <Button
                                    key={submenu.id}
                                    variant={isSubmenuActive ? "default" : "ghost"}
                                    className={`w-full justify-start gap-2 text-sm h-9 ${
                                      isSubmenuActive ? "bg-[#EFC200] hover:bg-[#D4A900] text-black" : "text-slate-600"
                                    }`}
                                    onClick={() => {
                                      onMenuChange(submenu.id);
                                      toggleMobileSidebar();
                                    }}
                                  >
                                    <SubmenuIcon className="w-4 h-4 flex-shrink-0" />
                                    <span>{submenu.label}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive ? "bg-[#EFC200] hover:bg-[#D4A900] text-black" : ""
                    }`}
                    onClick={() => {
                      onMenuChange(item.id);
                      toggleMobileSidebar();
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-3 border-t space-y-2">
              {checkinHoje ? (
                <div className={`px-3 py-3 mb-2 rounded-lg ${
                  checkinHoje.dentro_prazo 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className={`flex items-center justify-center gap-2 ${
                    checkinHoje.dentro_prazo ? "text-green-700" : "text-red-700"
                  }`}>
                    {checkinHoje.dentro_prazo ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <p className="text-xs font-semibold">
                      {checkinHoje.dentro_prazo ? "Pronto para Leads" : "Fora do horário"}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-3 hover:bg-slate-100 mb-2"
                  onClick={() => onOpenCheckin && onOpenCheckin()}
                >
                  <div className="flex items-center gap-3">
                    <Inbox className="w-5 h-5" />
                    <span>Receber Leads</span>
                  </div>
                  <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <span className="text-white text-xs font-bold">!</span>
                  </span>
                </Button>
              )}
              
              <div className="px-3 py-2 mb-2">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-slate-500">{user?.role === "admin" ? "Administrador" : "Usuário"}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm("Deseja realmente sair?")) {
                    window.location.href = "/";
                  }
                }}
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}