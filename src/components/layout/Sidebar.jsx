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
  Megaphone,
  ChevronDown,
  Briefcase,
  UsersRound,
  Handshake,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ user, activeMenu, onMenuChange }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [crmExpanded, setCrmExpanded] = useState(false);
  const [controleExpanded, setControleExpanded] = useState(false);

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
        { id: "crm-leads", label: "Fila de Leads", icon: Users, description: "Kanban" },
        { id: "crm-negociacoes", label: "Negociações", icon: Handshake },
        { id: "crm-perdas", label: "Perdas", icon: TrendingDown },
        { id: "crm-distribuicao", label: "Distribuição", icon: TrendingUp },
        { id: "crm-dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "crm-marketing", label: "Marketing", icon: Megaphone },
      ]
    },
    { id: "aprovacoes", label: "Aprovações", icon: CheckCircle },
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
              const isExpanded = item.id === "crm" ? crmExpanded : controleExpanded;
              const toggleExpanded = item.id === "crm" 
                ? () => setCrmExpanded(!crmExpanded) 
                : () => setControleExpanded(!controleExpanded);
              
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
                  const isExpanded = item.id === "crm" ? crmExpanded : controleExpanded;
                  const toggleExpanded = item.id === "crm" 
                    ? () => setCrmExpanded(!crmExpanded) 
                    : () => setControleExpanded(!controleExpanded);
                  
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