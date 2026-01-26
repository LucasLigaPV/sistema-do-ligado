import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const PLANO_CARREIRA = [
  { vendas: 0, nivel: "Nível 1", comissaoPorPlaca: 30, percentualAdesao: 0, recorrencia: 0 },
  { vendas: 20, nivel: "Nível 2", comissaoPorPlaca: 30, percentualAdesao: 0, recorrencia: 0 },
  { vendas: 25, nivel: "Nível 3", comissaoPorPlaca: 0, percentualAdesao: 50, recorrencia: 4 },
  { vendas: 40, nivel: "Nível 4", comissaoPorPlaca: 0, percentualAdesao: 100, recorrencia: 6 },
  { vendas: 50, nivel: "Nível 5", comissaoPorPlaca: 0, percentualAdesao: 100, recorrencia: 8 },
];

const formatarValor = (valor) => {
  const numero = typeof valor === 'string' 
    ? parseFloat(valor.replace(/[^0-9,]/g, "").replace(",", ".")) 
    : valor;
  
  if (isNaN(numero)) return "0,00";
  
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function TabelaFechamentos() {
  const { data: usuarios = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: vendas = [], isLoading: loadingVendas } = useQuery({
    queryKey: ["vendas"],
    queryFn: () => base44.entities.Venda.list(),
  });

  const fechamentos = useMemo(() => {
    if (!usuarios.length || !vendas.length) return [];

    return usuarios
      .filter(user => user.funcao === "vendedor" || user.funcao === "lider")
      .map(user => {
        const vendasDoVendedor = vendas.filter(v => v.vendedor === user.email);
        const totalVendas = vendasDoVendedor.length;
        
        const totalAdesao = vendasDoVendedor.reduce((sum, v) => {
          const valor = parseFloat(v.valor_adesao?.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
          return sum + valor;
        }, 0);

        // Calcular nível
        let nivelAtual = PLANO_CARREIRA[0];
        for (let i = PLANO_CARREIRA.length - 1; i >= 0; i--) {
          if (totalVendas >= PLANO_CARREIRA[i].vendas) {
            nivelAtual = PLANO_CARREIRA[i];
            break;
          }
        }

        // Calcular comissão
        let comissaoValor = 0;
        if (nivelAtual.comissaoPorPlaca > 0) {
          comissaoValor = totalVendas * nivelAtual.comissaoPorPlaca;
        } else {
          comissaoValor = (totalAdesao * nivelAtual.percentualAdesao) / 100;
        }

        return {
          nome: user.full_name || user.email,
          email: user.email,
          funcao: user.funcao,
          totalVendas,
          nivelAtual: nivelAtual.nivel,
          comissaoAdesao: comissaoValor,
          recorrencia: nivelAtual.recorrencia,
          chavePix: user.chave_pix || "-",
        };
      })
      .sort((a, b) => b.comissaoAdesao - a.comissaoAdesao);
  }, [usuarios, vendas]);

  const totais = useMemo(() => {
    return fechamentos.reduce((acc, f) => {
      acc.totalComissao += f.comissaoAdesao;
      acc.totalVendas += f.totalVendas;
      return acc;
    }, { totalComissao: 0, totalVendas: 0 });
  }, [fechamentos]);

  if (loadingUsers || loadingVendas) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-300px)]">
        <div className="w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Fechamento de Comissões</h2>
        <p className="text-slate-500">Visualize o fechamento de todos os vendedores e líderes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Vendedores</p>
                <p className="text-3xl font-bold text-slate-900">{fechamentos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Vendas</p>
                <p className="text-3xl font-bold text-slate-900">{totais.totalVendas}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Comissões</p>
                <p className="text-3xl font-bold text-[#EFC200]">
                  R$ {formatarValor(totais.totalComissao)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#FFF9E6] rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#EFC200]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Nome do Vendedor</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-center">Total Vendas</TableHead>
                <TableHead className="text-center">Nível Alcançado</TableHead>
                <TableHead className="text-right">Comissão Adesão</TableHead>
                <TableHead className="text-center">Recorrência</TableHead>
                <TableHead>Chave Pix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    Nenhum vendedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                fechamentos.map((fechamento, index) => (
                  <motion.tr
                    key={fechamento.email}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{fechamento.nome}</p>
                        <p className="text-xs text-slate-500">{fechamento.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {fechamento.funcao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-slate-700">
                      {fechamento.totalVendas}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-0">
                        {fechamento.nivelAtual}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#EFC200]">
                      R$ {formatarValor(fechamento.comissaoAdesao)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-100 text-emerald-800">
                        {fechamento.recorrencia}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {fechamento.chavePix}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}