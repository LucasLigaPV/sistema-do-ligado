import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TableIcon, Settings, LogOut, ShieldCheck, FileText, BarChart3, Plus } from "lucide-react";
import { motion } from "framer-motion";
import TabelaIndicacoes from "../components/admin/TabelaIndicacoes";
import ConfiguracaoFormularioAdmin from "../components/admin/ConfiguracaoFormularioAdmin";
import DashboardContent from "../components/admin/DashboardContent";
import FormularioIndicacao from "../components/indicacao/FormularioIndicacao";
import TabelaVendas from "../components/vendas/TabelaVendas";
import ResumoVendedor from "../components/vendas/ResumoVendedor";
import TabelaFechamentos from "../components/vendas/TabelaFechamentos";
import DashboardVendas from "../components/vendas/DashboardVendas";
import Sidebar from "../components/layout/Sidebar";

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
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Indicações</h2>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#EFC200] hover:bg-[#D4A900] text-black">
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Nova Indicação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Registrar Nova Indicação</DialogTitle>
                      </DialogHeader>
                      <FormularioIndicacao onSuccess={() => setDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                <Tabs defaultValue="indicacoes" className="space-y-6">
                  <TabsList className="bg-white shadow-md p-1.5 rounded-xl h-14">
                    <TabsTrigger
                      value="indicacoes"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                    >
                      <TableIcon className="w-4 h-4" />
                      Indicações
                    </TabsTrigger>
                    {user?.funcao === "lider" && (
                      <TabsTrigger
                        value="dashboard"
                        className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Dashboard
                      </TabsTrigger>
                    )}
                    {user?.role === "admin" && (
                      <>
                        <TabsTrigger
                          value="dashboard"
                          className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Dashboard
                        </TabsTrigger>
                        <TabsTrigger
                          value="configuracoes"
                          className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                        >
                          <Settings className="w-4 h-4" />
                          Configurações
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>

                  <TabsContent value="indicacoes">
                    <TabelaIndicacoes userEmail={user?.email} userRole={user?.role} />
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <DashboardContent userEmail={user?.email} userRole={user?.role} />
                  </TabsContent>

                  {user?.role === "admin" && (
                    <TabsContent value="configuracoes">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-2">
                          Configurações do Formulário
                        </h2>
                        <p className="text-slate-500">
                          Gerencie as opções disponíveis no formulário de indicação
                        </p>
                      </div>
                      <ConfiguracaoFormularioAdmin />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            {activeMenu === "vendas" && (
              <div className="space-y-6">
                <Tabs defaultValue="registrar" className="space-y-6">
                  <TabsList className="bg-white shadow-md p-1.5 rounded-xl h-14">
                    <TabsTrigger
                      value="registrar"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                    >
                      <TableIcon className="w-4 h-4" />
                      Registrar e Acompanhar
                    </TabsTrigger>
                    <TabsTrigger
                      value="resumo"
                      className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                    >
                      <FileText className="w-4 h-4" />
                      Resumo
                    </TabsTrigger>
                    {(user?.role === "admin" || user?.funcao === "lider") && (
                      <>
                        <TabsTrigger
                          value="fechamentos"
                          className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Fechamentos
                        </TabsTrigger>
                        <TabsTrigger
                          value="dashboard"
                          className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Dashboard
                        </TabsTrigger>
                      </>
                    )}
                    {user?.role === "admin" && (
                      <TabsTrigger
                        value="configuracoes"
                        className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
                      >
                        <Settings className="w-4 h-4" />
                        Configurações
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="registrar">
                    <TabelaVendas userEmail={user?.email} userRole={user?.role} />
                  </TabsContent>

                  <TabsContent value="resumo">
                    <ResumoVendedor userEmail={user?.email} />
                  </TabsContent>

                  <TabsContent value="fechamentos">
                    <TabelaFechamentos />
                  </TabsContent>

                  <TabsContent value="dashboard">
                    <DashboardVendas userEmail={user?.email} userRole={user?.role} />
                  </TabsContent>

                  <TabsContent value="configuracoes">
                    <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                      <div className="text-center">
                        <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-700 mb-2">
                          Configurações de Vendas
                        </h2>
                        <p className="text-slate-500">
                          Em breve disponível
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}