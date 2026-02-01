import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserCog, Users, Shield, Edit, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function GerenciamentoUsuarios() {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", funcao: "vendedor" });
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list("full_name"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  const createEquipeMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipe.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["equipes"] }),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.filter({ ativa: true }),
  });

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const lideres = users.filter((u) => u.funcao === "lider");

  const handleFuncaoChange = async (userId, novaFuncao, userEmail, userName) => {
    const oldUser = users.find((u) => u.id === userId);
    
    // Se mudou para líder, criar equipe automaticamente
    if (novaFuncao === "lider" && oldUser.funcao !== "lider") {
      await createEquipeMutation.mutateAsync({
        nome: `Equipe ${userName || userEmail}`,
        lider_email: userEmail,
        membros: [],
        ativa: true,
      });
    }

    // Atualizar função do usuário
    updateMutation.mutate({
      id: userId,
      data: {
        funcao: novaFuncao,
        lider_email: novaFuncao === "lider" || novaFuncao === "master" ? null : oldUser.lider_email,
      },
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
    });
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: editForm,
      });
    }
  };

  const handleInviteUser = async () => {
    try {
      // Mapear função para role do sistema
      const role = inviteForm.funcao === "master" ? "admin" : "user";
      
      // Convidar usuário
      await base44.users.inviteUser(inviteForm.email, role);
      
      // Aguardar um pouco para o usuário ser criado
      setTimeout(async () => {
        // Buscar o usuário recém-criado
        const allUsers = await base44.entities.User.list();
        const newUser = allUsers.find(u => u.email === inviteForm.email);
        
        if (newUser) {
          // Atualizar com a função correta
          await updateMutation.mutateAsync({
            id: newUser.id,
            data: { funcao: inviteForm.funcao, status_convite: "pendente" },
          });

          // Se for líder, criar equipe
          if (inviteForm.funcao === "lider") {
            await createEquipeMutation.mutateAsync({
              nome: `Equipe ${inviteForm.email}`,
              lider_email: inviteForm.email,
              membros: [],
              ativa: true,
            });
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ["users"] });
        setShowInviteDialog(false);
        setInviteForm({ email: "", funcao: "vendedor" });
      }, 1500);
    } catch (error) {
      console.error("Erro ao convidar usuário:", error);
    }
  };

  const getStats = () => {
    const total = users.length;
    const masters = users.filter((u) => u.funcao === "master").length;
    const lideresCount = users.filter((u) => u.funcao === "lider").length;
    const vendedores = users.filter((u) => u.funcao === "vendedor" || !u.funcao).length;
    return { total, masters, lideresCount, vendedores };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gerenciamento de Usuários</h2>
        <p className="text-slate-500">Configure funções e hierarquia da equipe</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Total de Usuários</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#EFC200]" />
              <div>
                <p className="text-sm text-[#D4A900]">Masters</p>
                <p className="text-2xl font-bold text-[#D4A900]">{stats.masters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Líderes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.lideresCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-600">Vendedores</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.vendedores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <Label className="text-sm text-slate-600 mb-2 block">Buscar Usuário</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.funcao || "vendedor"}
                          onValueChange={(v) =>
                            handleFuncaoChange(user.id, v, user.email, user.full_name)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                            <SelectItem value="lider">Líder</SelectItem>
                            <SelectItem value="master">Master</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cadastro do Consultor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Nome Completo</Label>
              <Input
                value={editForm.full_name || ""}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">E-mail</Label>
              <Input
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="E-mail"
                type="email"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="bg-[#EFC200] hover:bg-[#D4A900] text-black">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Convidar Usuário */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">E-mail</Label>
              <Input
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                type="email"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Função</Label>
              <Select
                value={inviteForm.funcao}
                onValueChange={(v) => setInviteForm({ ...inviteForm, funcao: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-slate-500">
              Um e-mail será enviado para o usuário com instruções para definir sua senha.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser} className="bg-[#EFC200] hover:bg-[#D4A900] text-black">
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}