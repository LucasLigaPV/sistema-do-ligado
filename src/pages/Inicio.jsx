import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import DashboardVendasCompleto from "../components/dashboard/DashboardVendasCompleto";
import ModalCheckin from "../components/crm/ModalCheckin";

export default function Inicio() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("inicio");

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

  const menuOptions = [
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
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      <ModalCheckin userEmail={user?.email} />
      <Sidebar user={user} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeMenu === "inicio" ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo ao Sistema</h2>
                  <p className="text-slate-500">Escolha uma opção abaixo para começar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card
                      className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group h-full"
                      onClick={() => setActiveMenu("dashboard")}
                    >
                      <CardContent className="p-6">
                        <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <BarChart3 className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          Dashboard de Vendas
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Relatórios completos e insights estratégicos
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </>
            ) : activeMenu === "dashboard" ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Dashboard de Vendas</h2>
                  <p className="text-slate-500 text-sm">Análise completa de desempenho e insights estratégicos</p>
                </div>
                <DashboardVendasCompleto userEmail={user?.email} userFuncao={user?.funcao} />
              </>
            ) : null}
          </motion.div>
        </div>
      </main>
    </div>
  );
}