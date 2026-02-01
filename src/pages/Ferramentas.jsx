import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Image, Video, Zap, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";

const CATEGORIAS = {
  depoimentos: { nome: "Depoimentos de Cliente", icon: FileText, cor: "bg-blue-100 text-blue-600" },
  atalhos: { nome: "Atalhos Rápidos", icon: Zap, cor: "bg-purple-100 text-purple-600" },
  imagens: { nome: "Imagens", icon: Image, cor: "bg-emerald-100 text-emerald-600" },
  videos: { nome: "Vídeos", icon: Video, cor: "bg-rose-100 text-rose-600" },
};

export default function Ferramentas() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "depoimentos",
    tipo_arquivo: "",
    url_arquivo: "",
    thumbnail_url: "",
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } else {
        base44.auth.redirectToLogin("/Ferramentas");
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const { data: recursos = [], isLoading: loadingRecursos } = useQuery({
    queryKey: ["recursos"],
    queryFn: () => base44.entities.RecursoVenda.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecursoVenda.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recursos"] });
      setDialogOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        categoria: "depoimentos",
        tipo_arquivo: "",
        url_arquivo: "",
        thumbnail_url: "",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecursoVenda.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recursos"] });
    },
  });

  const handleFileUpload = async (e, campo) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [campo]: file_url });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDownload = (url, titulo) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = titulo;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recursosPorCategoria = (categoria) => {
    return recursos.filter((r) => r.categoria === categoria);
  };

  if (loading || loadingRecursos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      <Sidebar user={user} activeMenu="ferramentas" />

      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Ferramentas de Venda</h2>
              <p className="text-slate-500">Biblioteca de recursos para apoiar suas vendas</p>
            </div>
            {user?.role === "admin" && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#EFC200] hover:bg-[#D4A900] text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Recurso
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Recurso</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Título</Label>
                      <Input
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORIAS).map(([key, { nome }]) => (
                            <SelectItem key={key} value={key}>{nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Arquivo Principal</Label>
                      <Input type="file" onChange={(e) => handleFileUpload(e, "url_arquivo")} disabled={uploadingFile} />
                      {formData.url_arquivo && <p className="text-xs text-emerald-600 mt-1">✓ Arquivo enviado</p>}
                    </div>
                    <div>
                      <Label>Thumbnail (opcional)</Label>
                      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "thumbnail_url")} disabled={uploadingFile} />
                    </div>
                    <Button type="submit" className="w-full bg-[#EFC200] hover:bg-[#D4A900] text-black" disabled={uploadingFile || createMutation.isPending}>
                      {createMutation.isPending ? "Adicionando..." : "Adicionar Recurso"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Tabs defaultValue="depoimentos" className="space-y-6">
            <TabsList className="bg-white shadow-md p-1.5 rounded-xl">
              {Object.entries(CATEGORIAS).map(([key, { nome, icon: Icon }]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="gap-2 data-[state=active]:bg-[#EFC200] data-[state=active]:text-black rounded-lg px-4"
                >
                  <Icon className="w-4 h-4" />
                  {nome}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(CATEGORIAS).map(([key, { nome, icon: Icon, cor }]) => (
              <TabsContent key={key} value={key}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recursosPorCategoria(key).length === 0 ? (
                    <div className="col-span-full text-center py-20">
                      <Icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Nenhum recurso disponível nesta categoria</p>
                    </div>
                  ) : (
                    recursosPorCategoria(key).map((recurso, index) => (
                      <motion.div
                        key={recurso.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                          {recurso.thumbnail_url && (
                            <div className="h-40 bg-slate-100 overflow-hidden">
                              <img src={recurso.thumbnail_url} alt={recurso.titulo} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {!recurso.thumbnail_url && (
                            <div className={`h-40 ${cor} flex items-center justify-center`}>
                              <Icon className="w-16 h-16" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-slate-900 mb-1">{recurso.titulo}</h3>
                            {recurso.descricao && (
                              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{recurso.descricao}</p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleDownload(recurso.url_arquivo, recurso.titulo)}
                                className="flex-1 bg-[#EFC200] hover:bg-[#D4A900] text-black"
                                size="sm"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Baixar
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  onClick={() => deleteMutation.mutate(recurso.id)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}