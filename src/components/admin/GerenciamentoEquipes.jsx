import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserPlus, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GerenciamentoEquipes() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: equipes = [], isLoading: loadingEquipes } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.filter({ ativa: true }),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("full_name"),
  });

  const updateEquipeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipe.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipes"] }),
  });

  const filteredEquipes = equipes.filter((equipe) =>
    equipe.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const getLiderInfo = (email) => {
    return users.find((u) => u.email === email);
  };

  const getMembroInfo = (email) => {
    return users.find((u) => u.email === email);
  };

  const getVendedoresSemEquipe = () => {
    const vendedoresEmEquipes = equipes.flatMap((e) => e.membros || []);
    return users.filter(
      (u) =>
        (u.funcao === "vendedor" || !u.funcao) &&
        !vendedoresEmEquipes.includes(u.email)
    );
  };

  const adicionarMembro = (equipeId, vendedorEmail) => {
    const equipe = equipes.find((e) => e.id === equipeId);
    if (!equipe) return;

    const novosMembros = [...(equipe.membros || []), vendedorEmail];
    updateEquipeMutation.mutate({
      id: equipeId,
      data: { membros: novosMembros },
    });
  };

  const removerMembro = (equipeId, vendedorEmail) => {
    const equipe = equipes.find((e) => e.id === equipeId);
    if (!equipe) return;

    const novosMembros = (equipe.membros || []).filter((m) => m !== vendedorEmail);
    updateEquipeMutation.mutate({
      id: equipeId,
      data: { membros: novosMembros },
    });
  };

  if (loadingEquipes || loadingUsers) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  const vendedoresSemEquipe = getVendedoresSemEquipe();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gerenciamento de Equipes</h2>
        <p className="text-slate-500">Organize vendedores nas equipes de seus líderes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Total de Equipes</p>
                <p className="text-2xl font-bold text-slate-900">{equipes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-slate-500">Vendedores Alocados</p>
                <p className="text-2xl font-bold text-slate-900">
                  {equipes.reduce((acc, e) => acc + (e.membros?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm text-slate-500">Vendedores Sem Equipe</p>
                <p className="text-2xl font-bold text-slate-900">{vendedoresSemEquipe.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipes */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredEquipes.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-10 text-center text-slate-500">
                Nenhuma equipe encontrada
              </CardContent>
            </Card>
          ) : (
            filteredEquipes.map((equipe) => {
              const lider = getLiderInfo(equipe.lider_email);
              const vendedoresDisponiveis = getVendedoresSemEquipe();

              return (
                <motion.div
                  key={equipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#EFC200] flex items-center justify-center">
                            <Users className="w-6 h-6 text-black" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{equipe.nome}</CardTitle>
                            <p className="text-sm text-slate-500">
                              Líder: {lider?.full_name || equipe.lider_email}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {equipe.membros?.length || 0} vendedores
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Membros Atuais */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">
                          Membros da Equipe
                        </h4>
                        {equipe.membros?.length > 0 ? (
                          <div className="space-y-2">
                            {equipe.membros.map((membroEmail) => {
                              const membro = getMembroInfo(membroEmail);
                              return (
                                <div
                                  key={membroEmail}
                                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                                      {membro?.full_name?.[0] || "?"}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {membro?.full_name || membroEmail}
                                      </p>
                                      <p className="text-xs text-slate-500">{membroEmail}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removerMembro(equipe.id, membroEmail)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">
                            Nenhum vendedor nesta equipe ainda
                          </p>
                        )}
                      </div>

                      {/* Adicionar Membro */}
                      {vendedoresDisponiveis.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">
                            Adicionar Vendedor
                          </h4>
                          <div className="flex gap-2">
                            <Select
                              onValueChange={(email) => adicionarMembro(equipe.id, email)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecionar vendedor..." />
                              </SelectTrigger>
                              <SelectContent>
                                {vendedoresDisponiveis.map((vendedor) => (
                                  <SelectItem key={vendedor.id} value={vendedor.email}>
                                    {vendedor.full_name || vendedor.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}