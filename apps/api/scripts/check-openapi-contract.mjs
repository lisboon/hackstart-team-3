import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://openapi:openapi@localhost:5432/openapi";
process.env.JWT_SECRET = "openapi-contract-test-secret";

const require = createRequire(import.meta.url);
require("reflect-metadata");

const { Test } = require("@nestjs/testing");
const { DocumentBuilder, SwaggerModule } = require("@nestjs/swagger");
const metadata = require("../dist/metadata.js").default;
const { AppModule } = require("../dist/infra/http/app.module.js");

const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
}).compile();
const app = moduleRef.createNestApplication();

try {
  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().addBearerAuth().build(),
  );

  const requiredSchemas = [
    "ApiInfoResponseDto",
    "LoginBodyDto",
    "CreateUserBodyDto",
    "UpdateUserBodyDto",
    "UserResponseDto",
    "UsersPageResponseDto",
    "UpdateCompanyBodyDto",
    "CompanyResponseDto",
    "RecordSelfReportBodyDto",
    "SelfReportResponseDto",
    "SelfReportSummaryResponseDto",
  ];

  for (const name of requiredSchemas) {
    assert(
      document.components?.schemas?.[name],
      `OpenAPI schema ${name} is missing`,
    );
  }

  for (const [name, schema] of Object.entries(
    document.components?.schemas ?? {},
  )) {
    assert(
      "properties" in schema && Object.keys(schema.properties ?? {}).length > 0,
      `OpenAPI schema ${name} has no properties`,
    );
  }

  const documentedOperations = [
    ["/", "get", "200"],
    ["/auth/login", "post", "201"],
    ["/auth/me", "get", "200"],
    ["/users", "post", "201"],
    ["/users", "get", "200"],
    ["/users/me/password", "patch", "200"],
    ["/users/{id}", "get", "200"],
    ["/users/{id}", "patch", "200"],
    ["/users/{id}", "delete", "200"],
    ["/organizations/current", "get", "200"],
    ["/organizations/current", "patch", "200"],
    ["/me/self-report", "post", "201"],
    ["/me/summary", "get", "200"],
  ];

  const streamOperation = document.paths["/ai/runs/stream"]?.post;
  assert(streamOperation, "OpenAPI operation POST /ai/runs/stream is missing");
  assert(
    streamOperation.responses["200"],
    "POST /ai/runs/stream must document the 200 it actually returns",
  );
  assert(
    streamOperation.requestBody?.content?.["application/json"]?.schema,
    "POST /ai/runs/stream has no request body schema",
  );

  for (const [path, method, status] of documentedOperations) {
    const operation = document.paths[path]?.[method];
    assert(
      operation,
      `OpenAPI operation ${method.toUpperCase()} ${path} is missing`,
    );
    assert(
      operation.responses[status]?.content?.["application/json"]?.schema,
      `OpenAPI response ${status} for ${method.toUpperCase()} ${path} has no schema`,
    );
  }

  const documentedErrors = [
    ["/auth/login", "post", ["400", "422", "429"]],
    ["/auth/me", "get", ["401", "429"]],
    ["/users", "post", ["401", "403", "422", "429"]],
    ["/users/{id}", "get", ["401", "403", "404", "422"]],
    ["/users/{id}", "delete", ["401", "403", "404", "422", "429"]],
    ["/organizations/current", "get", ["401", "403", "422", "429"]],
    ["/organizations/current", "patch", ["401", "403", "422", "429"]],
    ["/ai/runs/stream", "post", ["401", "422", "429"]],
    ["/me/self-report", "post", ["401", "403", "422", "429"]],
    ["/me/summary", "get", ["401", "403", "422", "429"]],
  ];

  for (const [path, method, statuses] of documentedErrors) {
    const operation = document.paths[path]?.[method];
    for (const status of statuses) {
      assert(
        operation?.responses[status]?.content?.["application/json"]?.schema,
        `OpenAPI error ${status} for ${method.toUpperCase()} ${path} has no schema`,
      );
    }
  }

  const userSchema = document.components?.schemas?.UserResponseDto;
  assert(userSchema && "properties" in userSchema);
  assert(!("password" in (userSchema.properties ?? {})));
} finally {
  await app.close();
}
