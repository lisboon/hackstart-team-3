"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useManagerData } from "@/components/manager/manager-data";
import { Card } from "@/components/ui/card";
import type { AccessDay } from "@/schemas/organization";

/** "2026-09-08" vira "08/09" sem passar por Date: a data já é do calendário
 *  da unidade, e converter para instante faria o dia pular por fuso. */
function label(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function AccessChart() {
  const { data, loading, error } = useManagerData();

  return (
    <Card className="min-h-[360px] gap-3 lg:col-span-2">
      <header className="grid gap-1">
        <h2 className="text-lg font-semibold">Acessos por dia</h2>
        <p className="text-sm text-muted-foreground">
          Quantas pessoas da unidade usaram o app em cada dia deste mês.
        </p>
      </header>

      {loading && (
        <p className="py-16 text-center text-muted-foreground" role="status">
          Carregando…
        </p>
      )}

      {error && (
        <p className="py-16 text-center text-destructive" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && <Body series={data?.accessSeries ?? null} />}
    </Card>
  );
}

function Body({ series }: { series: AccessDay[] | null }) {
  // `null` aqui é supressão, não ausência: o servidor recusou publicar porque
  // a unidade é pequena demais. Uma série diária de grupo pequeno entrega mais
  // do que a média, não menos.
  if (series === null)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Dados insuficientes para preservar o anonimato da unidade.
      </p>
    );

  if (series.length === 0)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Nenhum registro neste mês ainda.
      </p>
    );

  const points = series.map((day) => ({ dia: label(day.date), pessoas: day.people }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="acessos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            labelFormatter={(dia) => `Dia ${dia}`}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              color: "var(--foreground)",
            }}
          />
          <Area
            type="monotone"
            dataKey="pessoas"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#acessos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
