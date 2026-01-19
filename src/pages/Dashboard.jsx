import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, TableIcon, Settings, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResumoIndicacoes from "../components/dashboard/ResumoIndicacoes";
import TopIndicadores from "../components/dashboard/TopIndicadores";
import TopConsultores from "../components/dashboard/TopConsultores";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        if (currentUser.role === "admin") {
          setUser(currentUser);
        } else {
          window.location.href = "/Formulario";
        }
      } else {
        base44.auth.redirectToLogin("/Dashboard");
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const { data: indicacoes = [], isLoading } = useQuery({
    queryKey: ["indicacoes"],
    queryFn: () => base44.entities.Indicacao.list("-created_date"),
  });

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
                <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
                <p className="text-xs text-slate-500">Sistema de Indicações</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="ghost" className="gap-2 bg-[#FFF9E6] text-[#D4A900] hover:bg-[#EFC200] hover:text-black">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to={createPageUrl("Admin")}>
                <Button variant="ghost" className="gap-2">
                  <TableIcon className="w-4 h-4" />
                  Indicações
                </Button>
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 hidden lg:block">
                {user.full_name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => base44.auth.logout()}
                className="gap-2 hidden md:flex"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {menuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pb-2 space-y-2"
              >
                <Link to={createPageUrl("Dashboard")} onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2 bg-[#FFF9E6]">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl("Admin")} onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <TableIcon className="w-4 h-4" />
                    Indicações
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Resumo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ResumoIndicacoes indicacoes={indicacoes} />
            </motion.div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TopIndicadores indicacoes={indicacoes} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TopConsultores indicacoes={indicacoes} />
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}