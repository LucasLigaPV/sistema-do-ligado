import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TableIcon, Settings, LogOut, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";
import TabelaIndicacoes from "../components/admin/TabelaIndicacoes";
import ConfiguracaoFormularioAdmin from "../components/admin/ConfiguracaoFormularioAdmin";
import DashboardContent from "../components/admin/DashboardContent";
import FormularioIndicacao from "../components/indicacao/FormularioIndicacao";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e47847403553d35324f72/c31703845_SimplePretoeAmarelo.png"
                alt="Liga"
                className="h-12 w-auto"
              />
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-slate-900">Painel Administrativo</h1>
                <p className="text-xs text-slate-500">Sistema de Indicações</p>
              </div>
            </div>



            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden md:block">
                {user.full_name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => base44.auth.logout()}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs defaultValue="indicacoes" className="space-y-6">
            <TabsList className="bg-white shadow-md p-1.5 rounded-xl h-14">
              <TabsTrigger
                value="indicacoes"
                className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
              >
                <TableIcon className="w-4 h-4" />
                Indicações
              </TabsTrigger>
              <TabsTrigger
                value="formulario"
                className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
              >
                <FileText className="w-4 h-4" />
                Formulário
              </TabsTrigger>
              <TabsTrigger
                value="dashboard"
                className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-6 h-11"
              >
                <ShieldCheck className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
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

            <TabsContent value="indicacoes">
              <TabelaIndicacoes userEmail={user?.email} userRole={user?.role} />
            </TabsContent>

            <TabsContent value="formulario">
              <FormularioIndicacao />
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
        </motion.div>
      </main>
    </div>
  );
}