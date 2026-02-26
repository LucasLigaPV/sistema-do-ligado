import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, TrendingUp, Users, Settings, Target, BarChart3, ListChecks, TrendingDown, Megaphone, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import ModalCheckin from "../components/crm/ModalCheckin";

export default function Inicio() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("inicio");
  const navigate = useNavigate();



  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } else {
        base44.auth.redirectToLogin("/Inicio");
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user?.role === "admin";
  const isLeader = user?.funcao === "lider";

  const menuOptions = [
    {
      title: "Pipeline de Negociações",
      description: "Gerencie suas negociações em andamento",
      icon: Target,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      link: "/Admin?menu=crm-negociacoes"
    },
    {
      title: "Vendas",
      description: "Registre e acompanhe suas vendas",
      icon: TrendingUp,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      link: "/Admin?menu=vendas"
    },
    {
      title: "Indicações",
      description: "Gerencie e acompanhe suas indicações",
      icon: FileText,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      link: "/Admin?menu=indicacoes"
    },
    ...(user?.funcao === "master" ? [{
      title: "Fila de Leads",
      description: "Visualize e gerencie a fila de leads",
      icon: ListChecks,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      link: "/Admin?menu=crm-leads"
    }] : []),
    {
      title: "Perdas",
      description: "Analise leads e negociações perdidas",
      icon: TrendingDown,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      link: "/Admin?menu=crm-perdas"
    },
    ...(isLeader || isAdmin ? [{
      title: "Distribuição de Leads",
      description: "Configure e monitore a distribuição",
      icon: Users,
      bgColor: "bg-cyan-50",
      iconColor: "text-cyan-600",
      link: "/Admin?menu=crm-distribuicao"
    }] : []),
    {
      title: "Dashboard de Vendas",
      description: "Visualize métricas e performance",
      icon: BarChart3,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      link: "/Admin?menu=crm-dashboard"
    },
    {
      title: "Rankings",
      description: "Acompanhe o desempenho da equipe",
      icon: Trophy,
      bgColor: "bg-slate-50",
      iconColor: "text-slate-700",
      link: "/Admin?menu=rankings"
    },
    ...(user?.funcao === "master" ? [{
      title: "Dashboard de Marketing",
      description: "Análise de campanhas e criativos",
      icon: Megaphone,
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      link: "/Admin?menu=crm-marketing"
    }] : []),
    ...(isAdmin ? [{
      title: "Configurações",
      description: "Gerencie usuários e equipes",
      icon: Settings,
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      link: "/Admin?menu=configuracoes"
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      <Sidebar user={user} activeMenu={activeMenu} onMenuChange={(menuId) => navigate(`/Admin?menu=${menuId}`)} />
      {/* ModalCheckin desativado */}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo ao Sistemato</h2>
              <p className="text-slate-500">Escolha uma opção abaixo para começar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuOptions.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={option.link}>
                    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                      <CardContent className="p-6">
                        <div className={`w-16 h-16 ${option.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <option.icon className={`w-8 h-8 ${option.iconColor}`} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {option.title}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          {option.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}