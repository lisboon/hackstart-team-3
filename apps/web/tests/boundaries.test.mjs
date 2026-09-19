import assert from "node:assert/strict";
import test from "node:test";
import { ESLint } from "eslint";

test("layer boundaries reject UI transport imports and React in services", async () => {
  const eslint = new ESLint();
  for (const [filePath, source] of [
    ["src/components/ui/probe.ts", 'import { request } from "@/lib/http/client"; export { request };'],
    ["src/components/ui/probe.ts", 'import { request } from "../../lib/http/client"; export { request };'],
    ["src/components/ui/probe.ts", 'import { login } from "@/services/auth/auth-service"; export { login };'],
    ["src/components/form/probe.ts", 'import { useAuth } from "../../hooks/auth/use-auth"; export { useAuth };'],
    ["src/services/auth/probe.ts", 'import { useState } from "react"; export { useState };'],
  ]) {
    const [result] = await eslint.lintText(source, { filePath });
    assert.ok(result.messages.some((message) => message.ruleId === "no-restricted-imports"), filePath);
  }
});
