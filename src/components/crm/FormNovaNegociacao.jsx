import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FormNovaNegociacao({ 
  open, 
  onOpenChange, 
  newDeal, 
  setNewDeal, 
  onSubmit,
  userFuncao 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Negociação</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome do Cliente *</Label>
              <Input
                value={newDeal.nome_cliente}
                onChange={(e) => setNewDeal({ ...newDeal, nome_cliente: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input
                value={newDeal.telefone}
                onChange={(e) => {
                  const numeros = e.target.value.replace(/\D/g, '');
                  let formatado = numeros;
                  if (numeros.length <= 11) {
                    if (numeros.length > 2) {
                      formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                    }
                    if (numeros.length > 7) {
                      formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                    }
                    setNewDeal({ ...newDeal, telefone: formatado });
                  }
                }}
                placeholder="(11) 00000-0000"
                maxLength={15}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newDeal.email}
                onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Placa</Label>
              <Input
                value={newDeal.placa}
                onChange={(e) => {
                  const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  let formatado = valor;
                  if (valor.length > 3) {
                    formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                  }
                  setNewDeal({ ...newDeal, placa: formatado });
                }}
                placeholder="ABC-1D23"
                maxLength={8}
              />
            </div>
            <div>
              <Label>Modelo do Veículo</Label>
              <Input
                value={newDeal.modelo_veiculo}
                onChange={(e) => setNewDeal({ ...newDeal, modelo_veiculo: e.target.value })}
              />
            </div>
            <div>
              <Label>Plano de Interesse</Label>
              <Select
                value={newDeal.plano_interesse}
                onValueChange={(value) => setNewDeal({ ...newDeal, plano_interesse: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="plano_van">Plano Van</SelectItem>
                  <SelectItem value="plano_moto">Plano Moto</SelectItem>
                  <SelectItem value="plano_caminhao">Plano Caminhão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select
                value={newDeal.origem}
                onValueChange={(value) => setNewDeal({ ...newDeal, origem: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_pre_sistema">Lead (Pré-sistema)</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="organico">Orgânico</SelectItem>
                  <SelectItem value="troca_titularidade">Troca de Titularidade</SelectItem>
                  <SelectItem value="troca_veiculo">Troca de Veículo</SelectItem>
                  <SelectItem value="segundo_veiculo">Segundo Veículo</SelectItem>
                  <SelectItem value="migracao">Migração</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Entrada</Label>
              <Input
                type="date"
                value={newDeal.data_entrada}
                onChange={(e) => setNewDeal({ ...newDeal, data_entrada: e.target.value })}
              />
            </div>
            <div>
              <Label>Valor da Mensalidade</Label>
              <Input
                value={newDeal.valor_mensalidade}
                onChange={(e) => {
                  const numeros = e.target.value.replace(/\D/g, '');
                  const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                  const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  setNewDeal({ ...newDeal, valor_mensalidade: formatado });
                }}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label>Valor da Adesão</Label>
              <Input
                value={newDeal.valor_adesao}
                onChange={(e) => {
                  const numeros = e.target.value.replace(/\D/g, '');
                  const valor = Math.min((parseInt(numeros) || 0) / 100, 1000);
                  const formatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  setNewDeal({ ...newDeal, valor_adesao: formatado });
                }}
                placeholder="R$ 0,00"
              />
            </div>
            {(userFuncao === "master" || userFuncao === "admin") && (
              <>
                <div>
                  <Label>Plataforma</Label>
                  <Input
                    value={newDeal.plataforma}
                    onChange={(e) => setNewDeal({ ...newDeal, plataforma: e.target.value })}
                    placeholder="Facebook, Google, etc."
                  />
                </div>
                <div>
                  <Label>Posicionamento</Label>
                  <Input
                    value={newDeal.posicionamento}
                    onChange={(e) => setNewDeal({ ...newDeal, posicionamento: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Anúncio (Ad)</Label>
                  <Input
                    value={newDeal.ad}
                    onChange={(e) => setNewDeal({ ...newDeal, ad: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Conjunto de Anúncios (AdSet)</Label>
                  <Input
                    value={newDeal.adset}
                    onChange={(e) => setNewDeal({ ...newDeal, adset: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Campanha</Label>
                  <Input
                    value={newDeal.campanha}
                    onChange={(e) => setNewDeal({ ...newDeal, campanha: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Página de Destino</Label>
                  <Input
                    value={newDeal.pagina}
                    onChange={(e) => setNewDeal({ ...newDeal, pagina: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#EFC200] hover:bg-[#D4A900] text-black">
              Criar Negociação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}