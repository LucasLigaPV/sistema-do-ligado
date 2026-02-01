import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function FormularioIndicacaoVenda({ venda, onSuccess }) {
  const queryClient = useQueryClient();
  
  // Verificar se já existe uma indicação para esta venda
  const { data: indicacoes = [] } = useQuery({
    queryKey: ["indicacoes", venda.id],
    queryFn: () => base44.entities.Indicacao.list(),
  });

  const indicacaoExistente = indicacoes.find(ind => ind.venda_id === venda.id);

  const [formData, setFormData] = useState({
    venda_id: venda.id,
    consultor_responsavel: venda.vendedor,
    nome_indicado: venda.cliente || "",
    placa_indicado: venda.placa || "",
    nome_indicador: "",
    cpf_indicador: "",
    email_indicador: "",
    telefone_indicador: "",
    relacao_indicador_indicado: "",
    vinculo_consultor: "",
    valor_indicacao: "",
    chave_pix: "",
    tipo_chave_pix: "",
    status: "pendente",
  });

  useEffect(() => {
    if (indicacaoExistente) {
      setFormData(indicacaoExistente);
    }
  }, [indicacaoExistente]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Indicacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicacoes"] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Indicacao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicacoes"] });
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (indicacaoExistente) {
      updateMutation.mutate({ id: indicacaoExistente.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg">
        <h4 className="font-semibold text-slate-700 mb-2">Venda Relacionada</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Cliente:</span>
            <span className="ml-2 font-medium">{venda.cliente}</span>
          </div>
          <div>
            <span className="text-slate-500">Placa:</span>
            <span className="ml-2 font-medium">{venda.placa}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Nome do Indicador *</Label>
          <Input
            value={formData.nome_indicador}
            onChange={(e) => setFormData({ ...formData, nome_indicador: e.target.value })}
            placeholder="Nome completo"
            required
          />
        </div>

        <div>
          <Label>CPF do Indicador *</Label>
          <Input
            value={formData.cpf_indicador}
            onChange={(e) => setFormData({ ...formData, cpf_indicador: formatCPF(e.target.value) })}
            placeholder="000.000.000-00"
            required
          />
        </div>

        <div>
          <Label>Telefone do Indicador *</Label>
          <Input
            value={formData.telefone_indicador}
            onChange={(e) => setFormData({ ...formData, telefone_indicador: formatPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>E-mail do Indicador</Label>
          <Input
            type="email"
            value={formData.email_indicador}
            onChange={(e) => setFormData({ ...formData, email_indicador: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <Label>Relação com Indicado *</Label>
          <Input
            value={formData.relacao_indicador_indicado}
            onChange={(e) => setFormData({ ...formData, relacao_indicador_indicado: e.target.value })}
            placeholder="Ex: Amigo, Familiar..."
            required
          />
        </div>

        <div>
          <Label>Vínculo com Consultor *</Label>
          <Input
            value={formData.vinculo_consultor}
            onChange={(e) => setFormData({ ...formData, vinculo_consultor: e.target.value })}
            placeholder="Ex: Cliente, Conhecido..."
            required
          />
        </div>

        <div>
          <Label>Valor da Indicação (R$) *</Label>
          <Input
            value={formData.valor_indicacao}
            onChange={(e) => setFormData({ ...formData, valor_indicacao: e.target.value })}
            placeholder="Ex: 50,00"
            required
          />
        </div>

        <div>
          <Label>Tipo de Chave Pix *</Label>
          <Select
            value={formData.tipo_chave_pix}
            onValueChange={(v) => setFormData({ ...formData, tipo_chave_pix: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="telefone">Telefone</SelectItem>
              <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label>Chave Pix *</Label>
          <Input
            value={formData.chave_pix}
            onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
            placeholder="Digite a chave Pix"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {indicacaoExistente ? "Atualizar Indicação" : "Cadastrar Indicação"}
        </Button>
      </div>
    </form>
  );
}