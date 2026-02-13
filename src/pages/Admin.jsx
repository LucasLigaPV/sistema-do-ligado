import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TableIcon, Settings, LogOut, ShieldCheck, FileText, BarChart3, Plus, Users, UsersRound } from "lucide-react";
import { motion } from "framer-motion";
import TabelaIndicacoes from "../components/admin/TabelaIndicacoes";
import ConfiguracaoFormularioAdmin from "../components/admin/ConfiguracaoFormularioAdmin";
import DashboardContent from "../components/admin/DashboardContent";
import FormularioIndicacao from "../components/indicacao/FormularioIndicacao";
import TabelaVendas from "../components/vendas/TabelaVendas";
import ResumoVendedor from "../components/vendas/ResumoVendedor";
import TabelaFechamentos from "../components/vendas/TabelaFechamentos";
import DashboardVendas from "../components/vendas/DashboardVendas";
import GerenciamentoUsuarios from "../components/admin/GerenciamentoUsuarios";
import GerenciamentoEquipes from "../components/admin/GerenciamentoEquipes";
import EdicaoUsuarios from "../components/admin/EdicaoUsuarios";
import DashboardLider from "../components/dashboard/DashboardLider";
import Sidebar from "../components/layout/Sidebar";
import FilaLeads from "../components/crm/FilaLeads";
import PipelineNegociacoes from "../components/crm/PipelineNegociacoes";
import Perdas from "../components/crm/Perdas";
import Distribuicao from "../components/crm/Distribuicao";
import Aprovacoes from "../components/crm/Aprovacoes";
import ModalCheckin from "../components/crm/ModalCheckin";
import DashboardCRM from "../components/crm/DashboardCRM";
import DashboardMarketing from "../components/crm/DashboardMarketing";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("menu") || "indicacoes";
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } else {
        base44.auth.redirectToLogin("/Admin");
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
            {activeMenu === "indicacoes" && (
              <div className="space-y-6">
                <Tabs defaultValue="indicacoes" className="space-y-6">
                  <div className="mb-3">
                    <h2 className="text-2xl font-bold text-slate-900">Indicações</h2>
                    <p className="text-slate-500">Visualize e acompanhe todas as indicações</p>
                  </div>

                  <TabsList className="bg-transparent p-0 gap-3 h-auto border-0">
                    <TabsTrigger
                      value="indicacoes"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <TableIcon className="w-4 h-4" />
                      Indicações
                    </TabsTrigger>
                    <TabsTrigger
                      value="dashboard"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="indicacoes">
                    <TabelaIndicacoes userEmail={user?.email} userRole={user?.role} userFuncao={user?.funcao} />
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <DashboardContent userEmail={user?.email} userRole={user?.role} userFuncao={user?.funcao} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeMenu === "vendas" && (
              <div className="space-y-6">
                <Tabs defaultValue="registrar" className="space-y-6">
                  <div className="mb-3">
                    <h2 className="text-2xl font-bold text-slate-900">Vendas</h2>
                    <p className="text-slate-500">Registre, acompanhe e gerencie suas vendas</p>
                  </div>

                  <TabsList className="bg-transparent p-0 gap-3 h-auto border-0">
                    <TabsTrigger
                      value="registrar"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <TableIcon className="w-4 h-4" />
                      Registrar e Acompanhar
                    </TabsTrigger>
                    <TabsTrigger
                      value="resumo"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Resumo
                    </TabsTrigger>
                    <TabsTrigger
                      value="dashboard"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </TabsTrigger>
                    {(user?.funcao === "master") && (
                      <TabsTrigger
                        value="fechamentos"
                        className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Fechamentos
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="registrar">
                    <TabelaVendas userEmail={user?.email} userRole={user?.role} userFuncao={user?.funcao} />
                  </TabsContent>

                  <TabsContent value="resumo">
                    <ResumoVendedor userEmail={user?.email} userFuncao={user?.funcao} />
                  </TabsContent>

                  <TabsContent value="fechamentos">
                    <TabelaFechamentos />
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <DashboardVendas userEmail={user?.email} userRole={user?.role} userFuncao={user?.funcao} />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeMenu === "configuracoes" && (user?.role === "admin" || user?.funcao === "master") && (
              <div className="space-y-6">
                <Tabs defaultValue="usuarios" className="space-y-6">
                  <div className="mb-3">
                    <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
                    <p className="text-slate-500">Gerencie configurações do sistema</p>
                  </div>

                  <TabsList className="bg-transparent p-0 gap-3 h-auto border-0">
                    <TabsTrigger
                      value="usuarios"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <Users className="w-4 h-4" />
                      Usuários
                    </TabsTrigger>
                    <TabsTrigger
                      value="edicao"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Edição de Usuários
                    </TabsTrigger>
                    {user?.funcao === "master" && (
                      <TabsTrigger
                        value="equipes"
                        className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black data-[state=active]:shadow-sm rounded-lg border border-slate-200 data-[state=active]:border-[#EFC200] px-5 py-2.5 bg-white hover:bg-slate-50 transition-all"
                      >
                        <UsersRound className="w-4 h-4" />
                        Equipes
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="usuarios">
                    <GerenciamentoUsuarios />
                  </TabsContent>

                  <TabsContent value="edicao">
                    <EdicaoUsuarios />
                  </TabsContent>

                  <TabsContent value="equipes">
                    <GerenciamentoEquipes />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeMenu === "crm-leads" && (
              <div className="space-y-6">
                <div className="mb-3">
                  <h2 className="text-2xl font-bold text-slate-900">Fila de Leads</h2>
                  <p className="text-slate-500">Gerencie leads provenientes de tráfego pago</p>
                </div>
                <FilaLeads />
              </div>
            )}

            {activeMenu === "crm-negociacoes" && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Negociações</h2>
                  <p className="text-slate-500 text-sm">Acompanhe o pipeline de vendas</p>
                </div>
                <PipelineNegociacoes userEmail={user?.email} userFuncao={user?.funcao} />
              </div>
            )}

            {activeMenu === "aprovacoes" && (
              <div>
                <Aprovacoes userEmail={user?.email} userFuncao={user?.funcao} />
              </div>
            )}

            {activeMenu === "crm-perdas" && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Perdas</h2>
                  <p className="text-slate-500 text-sm">Acompanhe leads perdidos e motivos</p>
                </div>
                <Perdas userEmail={user?.email} userFuncao={user?.funcao} />
              </div>
            )}

            {activeMenu === "crm-distribuicao" && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Distribuição de Leads</h2>
                  <p className="text-slate-500 text-sm">Gerencie check-ins e distribua leads automaticamente</p>
                </div>
                <Distribuicao userFuncao={user?.funcao} />
              </div>
            )}

            {activeMenu === "crm-dashboard" && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Dashboard de Vendas</h2>
                  <p className="text-slate-500 text-sm">Insights estratégicos e análise de performance</p>
                </div>
                <DashboardCRM userEmail={user?.email} userFuncao={user?.funcao} />
              </div>
            )}

            {activeMenu === "crm-marketing" && (
              <div>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Dashboard de Marketing</h2>
                  <p className="text-slate-500 text-sm">Análise de performance de campanhas e criativos</p>
                </div>
                <DashboardMarketing />
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}