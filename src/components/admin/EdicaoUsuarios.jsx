import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Save, X } from "lucide-react";

export default function EdicaoUsuarios() {
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);

  const queryClient = useQueryClient();

  const { data: usuarios = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogAberto(false);
      setUsuarioEditando(null);
      setNomeCompleto("");
    },
  });

  const abrirEdicao = (usuario) => {
    setUsuarioEditando(usuario);
    setNomeCompleto(usuario.Nome_Completo || "");
    setDialogAberto(true);
  };

  const salvarUsuario = () => {
    if (!usuarioEditando) return;

    updateUserMutation.mutate({
      id: usuarioEditando.id,
      data: { Nome_Completo: nomeCompleto }
    });
  };

  const getFuncaoLabel = (funcao) => {
    const labels = {
      admin: "Admin",
      master: "Master",
      lider: "Líder",
      vendedor: "Vendedor"
    };
    return labels[funcao] || funcao;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edição de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(usuario => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.email}</TableCell>
                  <TableCell>
                    {usuario.Nome_Completo || (
                      <span className="text-slate-400 italic">Não preenchido</span>
                    )}
                  </TableCell>
                  <TableCell>{getFuncaoLabel(usuario.funcao)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirEdicao(usuario)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={usuarioEditando?.email || ""}
                disabled
                className="bg-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input
                value={getFuncaoLabel(usuarioEditando?.funcao)}
                disabled
                className="bg-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogAberto(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={salvarUsuario}
              className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
              disabled={updateUserMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}