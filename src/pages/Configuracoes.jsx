import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          setUser(currentUser);
          setFullName(currentUser.full_name || "");
          setChavePix(currentUser.chave_pix || "");
        } else {
          navigate(createPageUrl("Inicio"));
        }
      } catch {
        navigate(createPageUrl("Inicio"));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await base44.auth.updateMe({
        full_name: fullName.trim(),
        chave_pix: chavePix.trim(),
      });
      setMessage("Configurações salvas com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Inicio"))}
            className="hover:bg-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
            <p className="text-slate-500">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* Settings Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Full Name */}
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">
                Nome Completo
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full"
              />
              <p className="text-xs text-slate-400 mt-1">
                Este é o nome que aparecerá em seus relatórios e nas equipes
              </p>
            </div>

            {/* Chave PIX */}
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">
                Chave PIX
              </Label>
              <Input
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder="CPF, E-mail ou Telefone"
                className="w-full"
              />
              <p className="text-xs text-slate-400 mt-1">
                Utilizada para receber pagamentos de indicações
              </p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">
                E-mail
              </Label>
              <Input
                value={user?.email || ""}
                disabled
                className="w-full bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">
                Seu e-mail não pode ser alterado
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.includes("sucesso")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => {
                  setFullName(user?.full_name || "");
                  setChavePix(user?.chave_pix || "");
                  setMessage("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}