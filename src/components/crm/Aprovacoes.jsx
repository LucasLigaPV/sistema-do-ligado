import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, Search, User, Phone, Mail, Car, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Aprovacoes({ userEmail, userFuncao }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNegociacao, setSelectedNegociacao] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [motivoNegacao, setMotivoNegacao] = useState("");

  const queryClient = useQueryClient();

  const { data: negociacoes = [] } = useQuery({
    queryKey: ["negociacoes"],
    queryFn: () => base44.entities.Negociacao.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: equipes = [] } = useQuery({
    queryKey: ["equipes"],
    queryFn: () => base44.entities.Equipe.list(),
  });

  const createVendaMutation = useMutation({
    mutationFn: (data) => base44.entities.Venda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
    },
  });

  const updateNegociacaoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negociacao.update(id, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["negociacoes"] });
      
      // Se aprovado, criar venda automaticamente
      if (data.etapa === "venda_ativa") {
        const negociacao = negociacoes.find(n => n.id === id);
        if (negociacao) {
          createVendaMutation.mutate({
            vendedor: negociacao.vendedor_email,
            data_venda: new Date().toISOString().split('T')[0],
            cliente: negociacao.nome_cliente,
            telefone: negociacao.telefone,
            plano_vendido: negociacao.plano_interesse || "essencial",
            placa: negociacao.placa || "",
            valor_adesao: negociacao.valor_adesao || "",
            forma_pagamento: "pix",
            canal_venda: negociacao.origem === "indicacao" ? "indicacao" : negociacao.origem === "organico" ? "troca_veiculo" : "lead",
            tem_indicacao: negociacao.origem === "indicacao" ? "sim" : "nao",
          });
        }
      }
      
      setShowApprovalModal(false);
      setSelectedNegociacao(null);
      setMotivoNegacao("");
    },
  });

  // Filtrar negociações aguardando aprovação
  let negociacoesParaAprovar = negociacoes.filter(n => 
    n.informacoes_conferidas && 
    n.etapa === "enviado_cadastro"
  );

  // Aplicar controle de acesso
  const minhaEquipe = equipes.find(e => e.lider_email === userEmail && e.ativa);
  const membrosEquipe = minhaEquipe ? minhaEquipe.membros : [];
  const todosVendedoresEquipe = minhaEquipe ? [minhaEquipe.lider_email, ...membrosEquipe] : [userEmail];

  if (userFuncao === "lider") {
    negociacoesParaAprovar = negociacoesParaAprovar.filter(n => 
      todosVendedoresEquipe.includes(n.vendedor_email)
    );
  } else if (userFuncao === "vendedor") {
    negociacoesParaAprovar = negociacoesParaAprovar.filter(n => 
      n.vendedor_email === userEmail
    );
  }

  // Aplicar busca
  const negociacoesFiltradas = negociacoesParaAprovar.filter(n =>
    n.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.telefone?.includes(searchTerm) ||
    n.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estatísticas
  const aguardando = negociacoesFiltradas.filter(n => !n.status_aprovacao || n.status_aprovacao === "aguardando").length;
  const aprovados = negociacoesFiltradas.filter(n => n.status_aprovacao === "aprovado").length;
  const negados = negociacoesFiltradas.filter(n => n.status_aprovacao === "negado").length;

  const getNomeVendedor = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const handleAprovar = async () => {
    if (!selectedNegociacao) return;

    const user = await base44.auth.me();
    
    updateNegociacaoMutation.mutate({
      id: selectedNegociacao.id,
      data: {
        status_aprovacao: "aprovado",
        aprovado_por: user.email,
        data_aprovacao: new Date().toISOString(),
        etapa: "venda_ativa"
      }
    });
  };

  const handleNegar = async () => {
    if (!selectedNegociacao || !motivoNegacao) {
      alert("Por favor, informe o motivo da negação");
      return;
    }

    const user = await base44.auth.me();
    
    updateNegociacaoMutation.mutate({
      id: selectedNegociacao.id,
      data: {
        status_aprovacao: "negado",
        motivo_negacao: motivoNegacao,
        aprovado_por: user.email,
        data_aprovacao: new Date().toISOString(),
        informacoes_conferidas: false,
        etapa: "negada"
      }
    });
  };

  const getStatusBadge = (status) => {
    if (!status || status === "aguardando") {
      return <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>;
    }
    if (status === "aprovado") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Negado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Aprovações</h2>
        <p className="text-slate-600">Gerencie as vendas enviadas para cadastro</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Aguardando Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{aguardando}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{aprovados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Negados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{negados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Aprovações</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, telefone ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Conferido em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negociacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    Nenhuma negociação aguardando aprovação
                  </TableCell>
                </TableRow>
              ) : (
                negociacoesFiltradas.map((neg) => (
                  <TableRow key={neg.id}>
                    <TableCell className="font-medium">{neg.nome_cliente}</TableCell>
                    <TableCell>{neg.telefone}</TableCell>
                    <TableCell>{neg.placa || "-"}</TableCell>
                    <TableCell>{getNomeVendedor(neg.vendedor_email)}</TableCell>
                    <TableCell>
                      {neg.data_conferencia 
                        ? format(new Date(neg.data_conferencia), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : "-"
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(neg.status_aprovacao)}</TableCell>
                    <TableCell>
                      {(!neg.status_aprovacao || neg.status_aprovacao === "aguardando") && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedNegociacao(neg);
                            setShowApprovalModal(true);
                          }}
                          className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
                        >
                          Avaliar
                        </Button>
                      )}
                      {neg.status_aprovacao === "negado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedNegociacao(neg);
                            setShowApprovalModal(true);
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Aprovação */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliar Venda</DialogTitle>
          </DialogHeader>
          {selectedNegociacao && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  Revise todas as informações antes de aprovar. Uma aprovação move a venda para "Venda Ativa".
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Cliente</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedNegociacao.nome_cliente}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Telefone</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedNegociacao.telefone}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedNegociacao.email || "-"}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Placa</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Car className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedNegociacao.placa || "-"}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Modelo</Label>
                  <div className="mt-1">
                    <span className="font-medium">{selectedNegociacao.modelo_veiculo || "-"}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Plano</Label>
                  <div className="mt-1">
                    <span className="font-medium capitalize">{selectedNegociacao.plano_interesse || "-"}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Valor Adesão</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedNegociacao.valor_adesao || "-"}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Valor Mensalidade</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedNegociacao.valor_mensalidade || "-"}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-600">Vendedor Responsável</Label>
                  <div className="mt-1">
                    <span className="font-medium">{getNomeVendedor(selectedNegociacao.vendedor_email)}</span>
                  </div>
                </div>
                {selectedNegociacao.observacoes && (
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-600">Observações</Label>
                    <div className="mt-1 p-3 bg-slate-50 rounded-md">
                      <span className="text-sm">{selectedNegociacao.observacoes}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedNegociacao.status_aprovacao === "negado" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Negado</span>
                  </div>
                  <p className="text-sm text-red-800">
                    <strong>Motivo:</strong> {selectedNegociacao.motivo_negacao}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Por {getNomeVendedor(selectedNegociacao.aprovado_por)} em{" "}
                    {format(new Date(selectedNegociacao.data_aprovacao), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              )}

              {(!selectedNegociacao.status_aprovacao || selectedNegociacao.status_aprovacao === "aguardando") && (
                <>
                  <div>
                    <Label>Motivo da Negação (opcional)</Label>
                    <Textarea
                      value={motivoNegacao}
                      onChange={(e) => setMotivoNegacao(e.target.value)}
                      placeholder="Descreva o motivo caso vá negar esta aprovação..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleNegar}
                      disabled={!motivoNegacao}
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Negar
                    </Button>
                    <Button
                      onClick={handleAprovar}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar e Ativar Venda
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}