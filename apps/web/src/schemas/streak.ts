import { z } from "zod";

/**
 * Contrato de `GET /me/streak`. A ofensiva é contra o próprio passado:
 * `longestStreak` é recorde pessoal, nunca comparação com outras pessoas. A
 * proteção (congelamento) evita que um dia perdido zere a sequência.
 *
 * `closed` é o dia em que a unidade não abriu — fim de semana, feriado,
 * recesso. Ele não é `missed`: não havia diária a fazer, então a tela não tem
 * o que cobrar.
 */
export const weekDayStateSchema = z.enum([
  "done",
  "today",
  "future",
  "missed",
  "protected",
  "closed",
]);

export type WeekDayState = z.infer<typeof weekDayStateSchema>;

export const streakWeekDaySchema = z.object({
  date: z.iso.datetime(),
  weekday: z.number().int().min(0).max(6),
  state: weekDayStateSchema,
});

export type StreakWeekDay = z.infer<typeof streakWeekDaySchema>;

export const streakSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  week: z.array(streakWeekDaySchema).length(7),
  freezesAvailable: z.number().int().min(0),
  freezeApplied: z.boolean(),
});

export type Streak = z.infer<typeof streakSchema>;
