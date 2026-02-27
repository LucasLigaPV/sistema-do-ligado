import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileVideo, ImageIcon, Clock } from "lucide-react";
import { format } from "date-fns";

const MAX_SIZE_MB = 80;

export default function AnexosReprova({ negociacao, onUpdate, readOnly = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Verifica se algum motivo exige anexo (vistoria_fotos ou vistoria_videos)
  const motivosVistoria = (negociacao?.motivos_reprova || []).filter(
    m => (m.categoria === "vistoria_fotos" || m.categoria === "vistoria_videos") && !m.corrigido
  );

  const precisaAnexo = motivosVistoria.length > 0;
  const anexos = negociacao?.anexos_reprova || [];
  const temAnexo = anexos.some(a => !a.expirado);

  if (!precisaAnexo && anexos.length === 0) return null;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Arquivo muito grande. O limite é ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const novoAnexo = {
      url: file_url,
      nome: file.name,
      tipo: file.type,
      data_upload: new Date().toISOString(),
      expirado: false
    };

    const anexosAtualizados = [...(negociacao.anexos_reprova || []), novoAnexo];
    await base44.entities.Negociacao.update(negociacao.id, { anexos_reprova: anexosAtualizados });
    onUpdate();
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {precisaAnexo && !readOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            Anexe o arquivo de vistoria para liberar a correção
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="border-amber-300 text-amber-800 hover:bg-amber-100 w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Enviando..." : `Anexar arquivo (máx. ${MAX_SIZE_MB}MB)`}
          </Button>
        </div>
      )}

      {anexos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Arquivos Enviados</p>
          {anexos.map((anexo, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                anexo.expirado ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200"
              }`}
            >
              {anexo.tipo?.startsWith("video/") ? (
                <FileVideo className={`w-4 h-4 flex-shrink-0 ${anexo.expirado ? "text-slate-400" : "text-slate-600"}`} />
              ) : (
                <ImageIcon className={`w-4 h-4 flex-shrink-0 ${anexo.expirado ? "text-slate-400" : "text-slate-600"}`} />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${anexo.expirado ? "text-slate-400" : "text-slate-700"}`}>
                  {anexo.nome}
                </p>
                {anexo.data_upload && (
                  <p className="text-xs text-slate-400">
                    {format(new Date(anexo.data_upload), "dd/MM/yyyy HH:mm")}
                  </p>
                )}
              </div>
              {anexo.expirado ? (
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>Arquivo expirado</span>
                </div>
              ) : (
                <a href={anexo.url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}