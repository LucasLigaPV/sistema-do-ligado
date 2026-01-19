import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, Users, Link2, Heart, DollarSign, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const configLabels = {
  consultores: { label: "Consultores", icon: Users, color: "bg-[#EFC200]" },
  relacoes: { label: "Tipos de Relação", icon: Link2, color: "bg-[#D4A900]" },
  vinculos: { label: "Tipos de Vínculo", icon: Heart, color: "bg-[#EFC200]" },
  valores: { label: "Valores de Indicação", icon: DollarSign, color: "bg-[#D4A900]" },
  tipos_chave: { label: "Tipos de Chave Pix", icon: Key, color: "bg-[#EFC200]" },
};

export default function ConfiguracaoFormularioAdmin() {
  const [editingConfig, setEditingConfig] = useState(null);
  const [newOption, setNewOption] = useState("");
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["configs"],
    queryFn: () => base44.entities.ConfiguracaoFormulario.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConfiguracaoFormulario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
    },
  });

  const handleAddOption = (config) => {
    if (!newOption.trim()) return;
    const updatedOpcoes = [...(config.opcoes || []), newOption.trim()];
    updateMutation.mutate({ id: config.id, data: { opcoes: updatedOpcoes } });
    setNewOption("");
  };

  const handleRemoveOption = (config, optionToRemove) => {
    const updatedOpcoes = config.opcoes.filter((op) => op !== optionToRemove);
    updateMutation.mutate({ id: config.id, data: { opcoes: updatedOpcoes } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configs.map((config) => {
          const configInfo = configLabels[config.tipo] || { label: config.tipo, icon: Users, color: "bg-slate-500" };
          const Icon = configInfo.icon;
          const isEditing = editingConfig === config.id;

          return (
            <motion.div
              key={config.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className={`${configInfo.color} text-black py-4`}>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Icon className="w-5 h-5" />
                    {configInfo.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {config.opcoes?.map((opcao) => (
                        <motion.div
                          key={opcao}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Badge
                            variant="secondary"
                            className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 transition-colors group"
                          >
                            {opcao}
                            {isEditing && (
                              <button
                                onClick={() => handleRemoveOption(config, opcao)}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </button>
                            )}
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nova opção..."
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddOption(config)}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddOption(config)}
                          disabled={!newOption.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setEditingConfig(null)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Concluir Edição
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEditingConfig(config.id)}
                    >
                      Editar Opções
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}