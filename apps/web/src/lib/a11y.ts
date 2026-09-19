/**
 * Builds an aria-describedby value from the ids that currently exist.
 *
 * Every field primitive needs the same rule: a description and an error are
 * announced together, never one instead of the other, because an invalid field
 * is exactly when the instruction is still needed. Keeping the rule here means
 * there is one place to get it right instead of one per primitive.
 */
export function describedBy(
  ...ids: (string | false | null | undefined)[]
): string | undefined {
  const present = ids.filter((id): id is string => Boolean(id));
  return present.length > 0 ? present.join(" ") : undefined;
}
