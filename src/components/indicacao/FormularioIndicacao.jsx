import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Send, User, Car, Phone, Mail, Key, DollarSign, Users, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function FormularioIndicacao({ onSuccess }) {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          setUserEmail(user?.email || "");
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
      }
    };
    loadUser();
  }, []);

  const [formData, setFormData] = useState({
    nome_indicado: "",
    placa_indicado: "",
    nome_indicador: "",
    cpf_indicador: "",
    email_indicador: "",
    telefone_indicador: "",
    relacao_indicador_indicado: "",
    vinculo_consultor: "",
    valor_indicacao: "",
    chave_pix: "",
    tipo_chave_pix: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: configs = [] } = useQuery({
    queryKey: ["configs"],
    queryFn: () => base44.entities.ConfiguracaoFormulario.list(),
  });

  const getOpcoes = (tipo) => {
    const config = configs.find((c) => c.tipo === tipo);
    return config?.opcoes || [];
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Indicacao.create(data),
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        nome_indicado: "",
        placa_indicado: "",
        nome_indicador: "",
        cpf_indicador: "",
        email_indicador: "",
        telefone_indicador: "",
        relacao_indicador_indicado: "",
        vinculo_consultor: "",
        valor_indicacao: "",
        chave_pix: "",
        tipo_chave_pix: "",
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, consultor_responsavel: userEmail, status: "pendente" });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatPlaca = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <Card className="w-full max-w-md text-center border-0 shadow-2xl">
          <CardContent className="pt-12 pb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 text-[#EFC200] mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">
              Indicação Enviada!
            </h2>
            <p className="text-slate-500 mb-8">
              Sua indicação foi registrada com sucesso e será analisada em breve.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#EFC200] hover:bg-[#D4A900] text-black font-semibold"
            >
              Nova Indicação
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e47847403553d35324f72/c31703845_SimplePretoeAmarelo.png" 
            alt="Liga" 
            className="h-16 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Formulário de Indicação
          </h1>
          <p className="text-slate-500">
            Preencha os dados abaixo para registrar uma nova indicação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Indicado */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <Car className="w-5 h-5 text-[#EFC200]" />
                Dados do Associado Indicado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600 mb-2 block">Nome do associado indicado</Label>
                <Input
                  value={formData.nome_indicado}
                  onChange={(e) => handleChange("nome_indicado", e.target.value)}
                  placeholder="Nome completo"
                  className="h-12"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-600 mb-2 block">Placa do associado indicado</Label>
                <Input
                  value={formData.placa_indicado}
                  onChange={(e) => handleChange("placa_indicado", formatPlaca(e.target.value))}
                  placeholder="ABC1234"
                  className="h-12 uppercase"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Indicador */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <User className="w-5 h-5 text-[#EFC200]" />
                Dados do Indicador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600 mb-2 block">Nome do indicador</Label>
                <Input
                  value={formData.nome_indicador}
                  onChange={(e) => handleChange("nome_indicador", e.target.value)}
                  placeholder="Nome completo"
                  className="h-12"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-600 mb-2 block">CPF do indicador</Label>
                <Input
                  value={formData.cpf_indicador}
                  onChange={(e) => handleChange("cpf_indicador", formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="h-12"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-600 mb-2 block">E-mail do indicador</Label>
                  <Input
                    type="email"
                    value={formData.email_indicador}
                    onChange={(e) => handleChange("email_indicador", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="h-12"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-600 mb-2 block">Telefone do indicador</Label>
                  <Input
                    value={formData.telefone_indicador}
                    onChange={(e) => handleChange("telefone_indicador", formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="h-12"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-600 mb-2 block">Relação entre indicador e indicado</Label>
                <Select
                  value={formData.relacao_indicador_indicado}
                  onValueChange={(v) => handleChange("relacao_indicador_indicado", v)}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a relação" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoes("relacoes").map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-600 mb-2 block">
                  Você possui algum vínculo familiar ou de amizade com o indicador?
                </Label>
                <Select
                  value={formData.vinculo_consultor}
                  onValueChange={(v) => handleChange("vinculo_consultor", v)}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoes("vinculos").map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <DollarSign className="w-5 h-5 text-[#EFC200]" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-600 mb-2 block">Valor da indicação</Label>
                <Select
                  value={formData.valor_indicacao}
                  onValueChange={(v) => handleChange("valor_indicacao", v)}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o valor" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoes("valores").map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-600 mb-2 block">Chave Pix do indicador</Label>
                <Input
                  value={formData.chave_pix}
                  onChange={(e) => handleChange("chave_pix", e.target.value)}
                  placeholder="Digite a chave Pix"
                  className="h-12"
                  required
                />
              </div>
              <div>
                <Label className="text-slate-600 mb-2 block">Tipo de chave</Label>
                <Select
                  value={formData.tipo_chave_pix}
                  onValueChange={(v) => handleChange("tipo_chave_pix", v)}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getOpcoes("tipos_chave").map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-14 text-lg bg-[#EFC200] hover:bg-[#D4A900] text-black font-semibold shadow-lg"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Enviar Indicação
              </span>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}