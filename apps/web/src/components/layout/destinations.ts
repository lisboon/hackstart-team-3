import { Activity, Home, Route, Trophy, User } from "lucide-react";

/**
 * Os mesmos cinco destinos nas duas formas: barra de abas no celular, menu
 * lateral no desktop. Uma lista só para as duas não divergirem.
 */
export const DESTINATIONS = [
  { href: "/", label: "Hoje", Icon: Home },
  { href: "/progresso", label: "Progresso", Icon: Activity },
  { href: "/trilha", label: "Trilha", Icon: Route, center: true },
  { href: "/conquistas", label: "Conquistas", Icon: Trophy },
  { href: "/perfil", label: "Perfil", Icon: User },
] as const;
