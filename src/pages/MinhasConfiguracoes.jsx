import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Check, X } from "lucide-react";
import { motion } from "framer-motion";

export default function MinhasConfiguracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFullName(currentUser?.full_name || "");
      } else {
        base44.auth.redirectToLogin("/MinhasConfiguracoes");
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setMessage("Nome completo não pode estar vazio");
      return;
    }

    setIsSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName });
      setUser({ ...user, full_name: fullName });
      setIsEditing(false);
      setMessage("Nome atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Erro ao atualizar nome");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.full_name || "");
    setIsEditing(false);
    setMessage("");
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Minhas Configurações</h1>
            <p className="text-slate-500 mt-2">Gerencie suas informações de perfil</p>
          </div>

          {/* Profile Card */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EFC200] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-black" />
                </div>
                <CardTitle>Perfil</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    message.includes("sucesso")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message}
                </motion.div>
              )}

              {/* Email (Read-only) */}
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">E-mail</Label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                  {user?.email}
                </div>
                <p className="text-xs text-slate-500 mt-1">Seu e-mail não pode ser alterado</p>
              </div>

              {/* Full Name */}
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Nome Completo</Label>
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="h-10"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2 bg-[#EFC200] hover:bg-[#D4A900] text-black"
                      >
                        <Check className="w-4 h-4" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div className="font-medium text-slate-700">
                      {fullName || "Não informado"}
                    </div>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-900"
                    >
                      Editar
                    </Button>
                  </motion.div>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Este é o nome que aparecerá no sistema
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}