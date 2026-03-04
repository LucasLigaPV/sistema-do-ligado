import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Car, Flame, Snowflake } from "lucide-react";
import { format } from "date-fns";

export default function DealCard({ 
  deal, 
  onClick, 
  origensConfig, 
  formatarTelefone,
  userFuncao,
  getNomeVendedor 
}) {
  const abrirWhatsApp = (telefone) => {
    const numero = formatarTelefone(telefone);
    window.open(`https://wa.me/55${numero}`, '_blank');
  };

  const categoriesMotivo = {
    documentacao: "Documentação",
    contrato: "Contrato",
    vistoria_fotos: "Vistoria - Fotos",
    vistoria_videos: "Vistoria - Vídeos",
    preenchimento: "Preenchimento",
  };

  return (
    <Card
      className={`bg-white ${deal.status_aprovacao === "reprovado" || deal.etapa === "enviado_cadastro" ? "cursor-pointer" : "cursor-move"} hover:shadow-md`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="font-medium text-sm">
          {deal.nome_cliente}
        </div>
        {deal.telefone && (
          <div 
            className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#EFC200] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              abrirWhatsApp(deal.telefone);
            }}
          >
            <Phone className="w-3.5 h-3.5" />
            {deal.telefone}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          {deal.origem && (
            <Badge className={`text-xs border ${origensConfig[deal.origem]?.color || "bg-slate-50 text-slate-700 border-slate-200"}`}>
              {origensConfig[deal.origem]?.label || deal.origem}
            </Badge>
          )}
          {deal.temperatura && (
            <div className="flex items-center gap-1">
              {deal.temperatura === "quente" ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-orange-600">Quente</span>
                </>
              ) : (
                <>
                  <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-blue-500">Frio</span>
                </>
              )}
            </div>
          )}
        </div>
        {(deal.modelo_veiculo || deal.placa) && (
          <div className="flex items-center gap-2 text-sm font-semibold text-[#EFC200]">
            <Car className="w-4 h-4 flex-shrink-0" />
            <span className="break-words line-clamp-2">
              {deal.modelo_veiculo || deal.placa}
            </span>
          </div>
        )}
        {deal.observacoes && (
          <div className="text-xs text-slate-600 italic border-l-2 border-slate-300 pl-2 py-1 bg-slate-50 rounded">
            {deal.observacoes.length > 80 ? `${deal.observacoes.substring(0, 80)}...` : deal.observacoes}
          </div>
        )}
        {deal.subetapas && deal.etapa === "vistoria_assinatura_pix" && (
          <div className="flex flex-wrap gap-1">
            {deal.subetapas.map((subetapa) => (
              <Badge key={subetapa} className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                {subetapa === "aguardando_vistoria" && "Vistoria"}
                {subetapa === "aguardando_assinatura" && "Assinatura"}
                {subetapa === "aguardando_pix" && "Pix"}
              </Badge>
            ))}
          </div>
        )}
        {deal.valor_adesao && (
          <div className="text-sm font-medium text-slate-700">
            {deal.valor_adesao}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            {deal.data_entrada 
              ? format(new Date(deal.data_entrada), "dd/MM/yyyy")
              : format(new Date(deal.created_date), "dd/MM/yyyy")}
            {deal.hora_entrada && (
              <span className="ml-1 text-slate-400">· {deal.hora_entrada}</span>
            )}
          </div>
          {deal.status_aprovacao === "analisando" && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Em análise
            </Badge>
          )}
        </div>
        {deal.status_aprovacao === "reprovado" && (
          <div className="text-xs text-red-600 pt-2 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-2 mt-2 rounded-b space-y-1">
            {deal.motivos_reprova && deal.motivos_reprova.length > 0 ? (
              deal.motivos_reprova.map((motivo, idx) => (
                <div key={idx} className={motivo.corrigido ? "opacity-60 line-through" : ""}>
                  <strong>{categoriesMotivo[motivo.categoria]}:</strong> {motivo.detalhe}
                  {motivo.corrigido && " ✓"}
                </div>
              ))
            ) : (
              <>
                {deal.motivo_reprova_categoria && (
                  <div>
                    <strong>Categoria:</strong> {categoriesMotivo[deal.motivo_reprova_categoria] || deal.motivo_reprova_categoria}
                  </div>
                )}
                {deal.motivo_reprova_detalhe && (
                  <div>
                    <strong>Detalhe:</strong> {deal.motivo_reprova_detalhe}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {(userFuncao === "lider" || userFuncao === "master") && (
          <div className="text-xs text-slate-500 pt-1 border-t">
            {getNomeVendedor(deal.vendedor_email)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}