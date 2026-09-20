/**
 * Configurações descritas como dado, não como JSX. A lista de seções é o que um
 * teste pode afirmar sem montar tela — inclusive a regra de produto que importa
 * aqui: **Sair é sempre o último item da última seção**.
 *
 * Isso não é estética. O botão morava no topo de toda tela logada, onde o
 * polegar bate nele por acidente; sair sem querer de um app que a pessoa abre em
 * cinco minutos de intervalo é o tipo de atrito que faz ela não voltar.
 *
 * Acrescentar um ajuste é acrescentar um item aqui e um caso no `switch` da
 * view, e não mexer no desenho da lista.
 */
export type SettingsItemId =
  | "change-password"
  | "privacy"
  | "about"
  | "sign-out";

export type SettingsItem = {
  id: SettingsItemId;
  label: string;
  hint: string;
  /** `danger` separa visualmente o que encerra algo do que apenas informa. */
  tone?: "danger";
};

export type SettingsSection = {
  id: string;
  title: string;
  items: readonly SettingsItem[];
};

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: "account",
    title: "Conta",
    items: [
      {
        id: "change-password",
        label: "Trocar senha",
        // O servidor chama `invalidateTokens()` ao trocar a senha. Avisar antes
        // é mais honesto do que a pessoa descobrir sendo desconectada.
        hint: "Encerra a sessão em todos os aparelhos.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacidade",
    items: [
      {
        id: "privacy",
        label: "O que a sua empresa vê",
        hint: "Agregados da unidade, nunca a sua resposta.",
      },
    ],
  },
  {
    id: "about",
    title: "Sobre",
    items: [
      {
        id: "about",
        label: "Sobre o Colheita",
        hint: "O que este app faz, e o que ele não faz.",
      },
    ],
  },
  {
    id: "session",
    title: "Sessão",
    items: [
      {
        id: "sign-out",
        label: "Sair",
        hint: "Encerra a sessão neste aparelho.",
        tone: "danger",
      },
    ],
  },
];

/** Todos os itens na ordem em que aparecem, para afirmar a ordem em teste. */
export function settingsItems(
  sections: readonly SettingsSection[] = SETTINGS_SECTIONS,
): SettingsItem[] {
  return sections.flatMap((section) => [...section.items]);
}
