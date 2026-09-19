"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { getOrganizationIndicators, type OrganizationIndicators } from "@/services/organization/organization-service";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Smile, 
  Activity, 
  TrendingUp, 
  Wallet,
  ShieldAlert
} from "lucide-react";

export function ManagerDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState<OrganizationIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    getOrganizationIndicators(token)
      .then((res) => {
        if (active) {
          setData(res);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Erro ao carregar os dados.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return <div className="text-muted-foreground p-6 animate-pulse">Carregando painel...</div>;
  }

  if (error) {
    return <div className="text-destructive p-6">{error}</div>;
  }

  if (!data) return null;

  const isSuppressed = data.totalUsers < 5;

  return (
    <div className="grid gap-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Painel da Unidade</h1>
        <p className="text-muted-foreground mt-1">
          Visão agregada para gestores. Olá, {user?.name || "Gestor"}.
        </p>
      </header>

      <Card className="bg-muted/30 border-primary/20">
        <div className="flex items-start gap-4">
          <ShieldAlert className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h2 className="font-semibold text-lg mb-1">Atenção: Uso dos Dados</h2>
            <p className="text-sm text-muted-foreground">
              A ação sugerida pelos dados abaixo é estritamente de nível da unidade: 
              levar um assessor de investimentos, marcar palestras de educação financeira 
              ou revisar a jornada da equipe. <strong>Nunca convoque um indivíduo com base no uso do aplicativo.</strong>
            </p>
          </div>
        </div>
      </Card>

      {isSuppressed ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Dados insuficientes para preservar o anonimato</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            A sua unidade atualmente possui {data.totalUsers} participantes ativos no escopo.
            Para proteger a privacidade individual, os dados agregados só são exibidos quando há pelo menos 5 pessoas.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Aperto Financeiro"
            value={`${(data.tightPercentage * 100).toFixed(0)}%`}
            description="Declararam estar apertados neste mês."
            icon={<Wallet className="w-4 h-4" />}
          />
          <MetricCard
            title="Humor Agregado"
            value={data.moodTrend.toFixed(1)}
            description="Média de humor no período."
            icon={<Smile className="w-4 h-4" />}
          />
          <MetricCard
            title="Alcance"
            value={String(data.reach)}
            description="Pessoas que já usaram alguma vez."
            icon={<Users className="w-4 h-4" />}
          />
          <MetricCard
            title="Adesão"
            value={String(data.adherence)}
            description="Pessoas que usaram nos últimos 30 dias."
            icon={<Activity className="w-4 h-4" />}
          />
          <MetricCard
            title="Frequência"
            value={data.frequency.toFixed(1)}
            description="Média de dias com registro por pessoa."
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            title="Evolução"
            value={data.evolution.toFixed(1)}
            description="Média do mês anterior."
            icon={<Activity className="w-4 h-4" />}
          />
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, description, icon }: { title: string; value: string; description: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <div className="flex justify-between items-center text-muted-foreground mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}
