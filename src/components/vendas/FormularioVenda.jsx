import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function FormularioVenda({ onSuccess, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vendedor: userEmail,
    data_venda: new Date().toISOString().split('T')[0],
    etapa: "pagamento_ok",
    cliente: "",
    telefone: "",
    plano_vendido: "",
    placa: "",
    valor_adesao: "",
    forma_pagamento: "",
    canal_venda: "",
    tem_indicacao: "nao",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Venda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatPlate = (value) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Data da Venda *</Label>
          <Input
            type="date"
            value={formData.data_venda}
            onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Cliente *</Label>
          <Input
            value={formData.cliente}
            onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
            placeholder="Nome completo"
            required
          />
        </div>

        <div>
          <Label>Telefone *</Label>
          <Input
            value={formData.telefone}
            onChange={(e) =>
              setFormData({ ...formData, telefone: formatPhone(e.target.value) })
            }
            placeholder="(00) 00000-0000"
            required
          />
        </div>

        <div>
          <Label>Plano Vendido *</Label>
          <Select
            value={formData.plano_vendido}
            onValueChange={(v) => setFormData({ ...formData, plano_vendido: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essencial">Essencial</SelectItem>
              <SelectItem value="principal">Principal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Placa *</Label>
          <Input
            value={formData.placa}
            onChange={(e) =>
              setFormData({ ...formData, placa: formatPlate(e.target.value) })
            }
            placeholder="ABC1D23"
            maxLength={7}
            required
          />
        </div>

        <div>
          <Label>Valor Adesão (R$) *</Label>
          <Input
            value={formData.valor_adesao}
            onChange={(e) => setFormData({ ...formData, valor_adesao: e.target.value })}
            placeholder="Ex: R$ 150,00"
            required
          />
        </div>

        <div>
          <Label>Forma de Pagamento *</Label>
          <Select
            value={formData.forma_pagamento}
            onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">Pix</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Canal de Venda *</Label>
          <Select
            value={formData.canal_venda}
            onValueChange={(v) => setFormData({ ...formData, canal_venda: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="troca_veiculo">Troca de Veículo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Possui Indicação? *</Label>
          <Select
            value={formData.tem_indicacao}
            onValueChange={(v) => setFormData({ ...formData, tem_indicacao: v })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-[#EFC200] hover:bg-[#D4A900] text-black"
        >
          {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Registrar Venda
        </Button>
      </div>
    </form>
  );
}