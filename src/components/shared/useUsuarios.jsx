import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Hook centralizado para buscar usuários via backend function (com permissão elevada).
 * Retorna também um helper getNome(email) para exibir nome de exibição.
 */
export function useUsuarios() {
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listarUsuarios", {});
      return res.data?.usuarios || [];
    },
  });

  const getNome = (email) => {
    if (!email) return "-";
    const user = usuarios.find(
      (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
    );
    return user?.nome_exibicao || user?.full_name || email;
  };

  return { usuarios, isLoading, getNome };
}