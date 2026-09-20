"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { useManagerData } from "@/components/manager/manager-data";
import type { UnitIndicators } from "@/schemas/organization";
import { Card } from "@/components/ui/card";
import { ICON_STROKE } from "@/components/ui/icon";
import {
  Users,
  Smile,
  Activity,
  TrendingUp,
  Wallet,
  ShieldAlert,
} from "lucide-react";

/** Sem dado suficiente não é zero, e a tela não pode deixar parecer que é. */
const EMPTY = "—";

const percent = (value: number | null) =>
  value === null ? EMPTY : `${Math.round(value * 100)}%`;

const decimal = (value: number | null) =>
  value === null ? EMPTY : value.toFixed(1);

const whole = (value: number | null) =>
  value === null ? EMPTY : String(value);

export function ManagerDashboard() {
  const { user } = useAuth();
  // Os indicadores vêm do provedor da rota: o gráfico, o sino e estes cartões
  // leem a mesma resposta, então não há como um dizer um número e outro dizer
  // outro.
  const { data, loading, error } = useManagerData();

  if (loading) {
    return (
      <p className="p-6 text-muted-foreground" role="status">
        Carregando painel...
      </p>
    );
  }

  if (error) {
    return (
      <p className="p-6 text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Painel da Unidade</h1>
        <p className="mt-1 text-muted-foreground">
          Visão agregada para gestores. Olá, {user?.name || "Gestor"}.
        </p>
      </header>

      <Card className="border-primary/20 bg-muted/30">
        <div className="flex items-start gap-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="mb-1 text-lg font-semibold">Uso dos dados</h2>
            <p className="text-sm text-muted-foreground">
              A ação sugerida por estes números é de unidade: levar um assessor,
              marcar palestra de educação financeira ou revisar a jornada da
              equipe.{" "}
              <strong>
                Nunca convoque uma pessoa com base no uso do aplicativo.
              </strong>
            </p>
          </div>
        </div>
      </Card>

      {data.suppressed ? <Suppressed /> : <Indicators data={data} />}
    </div>
  );
}

/**
 * Abaixo do grupo mínimo o servidor não manda número nenhum, nem o tamanho da
 * unidade. A tela conta por que, sem revelar quanta gente falta.
 */
function Suppressed() {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <Users className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-medium">
        Dados insuficientes para preservar o anonimato
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Os números da unidade só aparecem quando há pessoas suficientes para que
        nenhuma delas seja identificável por trás da média.
      </p>
    </Card>
  );
}

function Indicators({ data }: { data: UnitIndicators }) {
  const evolution = data.previous?.averageMood ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Metric
        title="Aperto financeiro"
        value={percent(data.tightRatio)}
        description="De quem declarou o mês, quantos fecharam apertados."
        icon={<Wallet className="h-4 w-4" strokeWidth={ICON_STROKE} />}
      />
      <Metric
        title="Humor agregado"
        value={decimal(data.averageMood)}
        description="Média de 1 a 5 no mês."
        icon={<Smile className="h-4 w-4" strokeWidth={ICON_STROKE} />}
      />
      <Metric
        title="Alcance"
        value={whole(data.reach)}
        description={`Já usaram alguma vez, de ${whole(data.headcount)} na unidade.`}
        icon={<Users className="h-4 w-4" strokeWidth={ICON_STROKE} />}
      />
      <Metric
        title="Adesão"
        value={whole(data.active)}
        description="Registraram alguma coisa neste mês."
        icon={<Activity className="h-4 w-4" strokeWidth={ICON_STROKE} />}
      />
      <Metric
        title="Frequência"
        value={decimal(data.frequency)}
        description="Dias com registro por pessoa que manteve o diário."
        icon={<TrendingUp className="h-4 w-4" strokeWidth={ICON_STROKE} />}
      />
      <Metric
        title="Mês anterior"
        value={decimal(evolution)}
        description="Humor agregado do mês passado, para comparar."
        icon={<TrendingUp className="h-4 w-4" strokeWidth={ICON_STROKE} />}
      />
    </div>
  );
}

function Metric({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between text-muted-foreground">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {value === EMPTY ? "Ainda não há dado suficiente." : description}
      </p>
    </Card>
  );
}
