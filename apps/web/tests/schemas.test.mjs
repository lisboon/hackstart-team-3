import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema } from "../src/schemas/auth.ts";
import { aiPromptSchema } from "../src/schemas/ai.ts";

test("login validates email without imposing registration password limits", () => {
  assert.equal(
    loginSchema.safeParse({ email: "invalid", password: "x" }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: "person@example.test", password: "" })
      .success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: "person@example.test", password: "x" })
      .success,
    true,
  );
});
test("prompt trims whitespace and enforces boundary", () => {
  assert.equal(aiPromptSchema.safeParse({ prompt: "   " }).success, false);
  assert.equal(
    aiPromptSchema.safeParse({ prompt: "x".repeat(50001) }).success,
    false,
  );
  assert.equal(aiPromptSchema.parse({ prompt: " hello " }).prompt, "hello");
});
