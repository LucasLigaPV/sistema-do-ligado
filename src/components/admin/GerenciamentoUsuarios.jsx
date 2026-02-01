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
import { Search, UserCog, Users, Shield, Edit, CheckSquare, Square } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function GerenciamentoUsuarios() {
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "" });
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

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ userIds, liderEmail }) => {
      await Promise.all(
        userIds.map((id) =>
          base44.entities.User.update(id, { lider_email: liderEmail })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUsers([]);
    },
  });

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const lideres = users.filter((u) => u.funcao === "lider");

  const getStats = () => {
    const total = users.length;
    const masters = users.filter((u) => u.funcao === "master").length;
    const lideresCount = users.filter((u) => u.funcao === "lider").length;
    const vendedores = users.filter((u) => u.funcao === "vendedor" || !u.funcao).length;
    return { total, masters, lideresCount, vendedores };
  };

  const stats = getStats();

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkAssignLider = (liderEmail) => {
    if (selectedUsers.length === 0) return;
    bulkUpdateMutation.mutate({
      userIds: selectedUsers,
      liderEmail: liderEmail === "none" ? null : liderEmail,
    });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({ full_name: user.full_name || "", email: user.email || "" });
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      data: editForm,
    });
  };

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

      {/* Search and Bulk Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 space-y-4">
          <div>
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
          </div>

          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} {selectedUsers.length === 1 ? "usuário selecionado" : "usuários selecionados"}
              </span>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-blue-900">Atribuir líder:</Label>
                <Select onValueChange={handleBulkAssignLider}>
                  <SelectTrigger className="w-48 bg-white">
                    <SelectValue placeholder="Selecionar líder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Remover líder</SelectItem>
                    {lideres.map((lider) => (
                      <SelectItem key={lider.id} value={lider.email}>
                        {lider.full_name || lider.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers([])}
                className="ml-auto"
              >
                Limpar
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Líder Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
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
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                          className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.funcao || "vendedor"}
                          onValueChange={(v) =>
                            updateMutation.mutate({
                              id: user.id,
                              data: {
                                funcao: v,
                                lider_email: v === "lider" || v === "master" ? null : user.lider_email,
                              },
                            })
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
                        {user.funcao !== "lider" && user.funcao !== "master" ? (
                          <Select
                            value={user.lider_email || "none"}
                            onValueChange={(v) =>
                              updateMutation.mutate({
                                id: user.id,
                                data: { lider_email: v === "none" ? null : v },
                              })
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Selecionar líder" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem líder</SelectItem>
                              {lideres.map((lider) => (
                                <SelectItem key={lider.id} value={lider.email}>
                                  {lider.full_name || lider.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Nome Completo</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">E-mail</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="E-mail"
                type="email"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUser}
                className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}