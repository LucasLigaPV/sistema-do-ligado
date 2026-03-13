import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, XCircle, FileText, Upload, Wrench, FileSignature, CreditCard } from "lucide-react";

export default function ModalConferirInformacoesPipeline({
  open,
  conferenciaData,
  setConferenciaData,
  tentouEnviarConferencia,
  onConfirm,
  validarConferencia
}) {
  if (!conferenciaData) return null;

  const erros = tentouEnviarConferencia ? validarConferencia(conferenciaData) : {};
  const checklistCompleto = conferenciaData.cadastro_preenchido_power && conferenciaData.documentacoes_enviadas_power && conferenciaData.vistoria_realizada && conferenciaData.contrato_assinado && conferenciaData.pagamento_realizado;
  
  const FieldError = ({ campo }) => erros[campo] ? (
    <div className="flex items-center gap-1 mt-1">
      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
      <span className="text-xs text-red-500 font-medium">{erros[campo]}</span>
    </div>
  ) : null;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conferir Informações da Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 mb-1">ATENÇÃO!</p>
                <p className="text-sm text-amber-800">
                  Um erro nesta etapa pode comprometer a ativação e status da sua venda. Muita atenção!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#EFC200]" />
              Checklist de Envio
            </h3>
            <div className="space-y-2.5">
              {[
                { key: "cadastro_preenchido_power", label: "Preencheu Cadastro na Power", icon: FileText },
                { key: "documentacoes_enviadas_power", label: "Subiu as Documentações na Power", icon: Upload },
                { key: "vistoria_realizada", label: "Vistoria Realizada", icon: Wrench },
                { key: "contrato_assinado", label: "Contrato Assinado", icon: FileSignature },
                { key: "pagamento_realizado", label: "Pagamento Realizado", icon: CreditCard }
              ].map((item) => {
                const IconComponent = item.icon;
                const isChecked = conferenciaData[item.key] || false;
                const showChecklistError = tentouEnviarConferencia && !checklistCompleto && !isChecked;
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                      isChecked ? "bg-green-50 border border-green-200" : showChecklistError ? "bg-red-50 border border-red-200" : "bg-white border border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => setConferenciaData({ ...conferenciaData, [item.key]: !isChecked })}
                  >
                    <Checkbox
                      checked={isChecked}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(checked) => setConferenciaData({ ...conferenciaData, [item.key]: checked })}
                      className={`data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] flex-shrink-0 ${isChecked ? "ring-2 ring-[#EFC200]" : ""}`}
                    />
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isChecked ? "text-green-600" : showChecklistError ? "text-red-400" : "text-slate-400"}`} />
                    <span className={`text-sm flex-1 font-medium ${isChecked ? "text-green-700" : showChecklistError ? "text-red-600" : "text-slate-700"}`}>
                       {item.label}
                     </span>
                    {isChecked && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                    {showChecklistError && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={erros.nome_cliente ? "text-red-600" : ""}>Nome do Cliente *</Label>
              <Input
                value={conferenciaData.nome_cliente || ""}
                onChange={(e) => setConferenciaData({ ...conferenciaData, nome_cliente: e.target.value })}
                className={erros.nome_cliente ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError campo="nome_cliente" />
            </div>
            <div>
              <Label className={erros.telefone ? "text-red-600" : ""}>Telefone *</Label>
              <Input
                value={conferenciaData.telefone || ""}
                onChange={(e) => {
                  const numeros = e.target.value.replace(/\D/g, '');
                  let formatado = numeros;
                  if (numeros.length <= 11) {
                    if (numeros.length > 2) formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
                    if (numeros.length > 7) formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
                    setConferenciaData({ ...conferenciaData, telefone: formatado });
                  }
                }}
                placeholder="(11) 00000-0000"
                maxLength={15}
                className={erros.telefone ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError campo="telefone" />
            </div>
            <div>
              <Label className={erros.email ? "text-red-600" : ""}>E-mail *</Label>
              <Input
                type="email"
                value={conferenciaData.email || ""}
                onChange={(e) => setConferenciaData({ ...conferenciaData, email: e.target.value })}
                className={erros.email ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError campo="email" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Label className={erros.placa ? "text-red-600" : ""}>Placa {conferenciaData.zero_km ? "(opcional)" : "*"}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="zero_km_conf_pipeline"
                    checked={conferenciaData.zero_km || false}
                    onChange={(e) => setConferenciaData({ ...conferenciaData, zero_km: e.target.checked })}
                    className="w-4 h-4 cursor-pointer rounded"
                  />
                  <label htmlFor="zero_km_conf_pipeline" className="text-xs font-medium text-slate-600 cursor-pointer">0km</label>
                </div>
              </div>
              <Input
                value={conferenciaData.placa || ""}
                onChange={(e) => {
                  const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  let formatado = valor;
                  if (valor.length > 3) formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
                  setConferenciaData({ ...conferenciaData, placa: formatado });
                }}
                placeholder="ABC-1D23"
                maxLength={8}
                className={erros.placa ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError campo="placa" />
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={onConfirm}
              className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Informações Conferidas
            </Button>
          </div>

          <p className="text-center text-sm text-amber-700 font-medium">
            Um erro nesta etapa pode comprometer a ativação e status da sua venda, muita atenção!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}