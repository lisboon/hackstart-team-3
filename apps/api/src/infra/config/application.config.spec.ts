import {
  ApplicationConfigError,
  loadApplicationConfig,
} from "./application.config";

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "production",
  PORT: "4000",
  DATABASE_URL: "postgresql://user:password@localhost:5432/database",
  CORS_ORIGINS: "https://app.example.com, https://admin.example.com",
  JWT_SECRET: "a-secure-secret-with-at-least-32-characters",
  JWT_EXPIRES_IN: "2h",
  BCRYPT_ROUNDS: "13",
  THROTTLE_LIMIT: "50",
  THROTTLE_WINDOW_MS: "30000",
  AI_SERVICE_URL: "https://ai.example.com",
  AI_INTERNAL_TOKEN: "an-internal-token-with-at-least-32-characters",
  AI_TIMEOUT_MS: "45000",
});

describe("ApplicationConfig", () => {
  it("loads and normalizes a valid environment", () => {
    const config = loadApplicationConfig(validEnvironment());

    expect(config).toEqual({
      nodeEnv: "production",
      port: 4000,
      databaseUrl: "postgresql://user:password@localhost:5432/database",
      corsOrigins: ["https://app.example.com", "https://admin.example.com"],
      jwt: {
        secret: "a-secure-secret-with-at-least-32-characters",
        expiresIn: "2h",
      },
      bcryptRounds: 13,
      throttle: {
        limit: 50,
        windowMs: 30000,
      },
      ai: {
        serviceUrl: "https://ai.example.com",
        internalToken: "an-internal-token-with-at-least-32-characters",
        timeoutMs: 45000,
      },
      journeyWindow: {
        zone: "America/Cuiaba",
        days: [1, 2, 3, 4, 5],
        opensAt: { hour: 7, minute: 30 },
        closesAt: { hour: 18, minute: 0 },
      },
    });
  });

  describe("the journey window", () => {
    it("opens the whole week when the unit asks for it", () => {
      // E assim que a demonstracao roda: configuracao, nao excecao no codigo.
      const config = loadApplicationConfig({
        ...validEnvironment(),
        JOURNEY_WINDOW_DAYS: "0,1,2,3,4,5,6",
      });

      expect(config.journeyWindow.days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("reads a different zone and a different pair of hours", () => {
      const config = loadApplicationConfig({
        ...validEnvironment(),
        JOURNEY_WINDOW_ZONE: "America/Belem",
        JOURNEY_WINDOW_OPENS: "06:00",
        JOURNEY_WINDOW_CLOSES: "14:20",
      });

      expect(config.journeyWindow.zone).toBe("America/Belem");
      expect(config.journeyWindow.opensAt).toEqual({ hour: 6, minute: 0 });
      expect(config.journeyWindow.closesAt).toEqual({ hour: 14, minute: 20 });
    });

    it("refuses a zone that does not exist, instead of failing at the first request", () => {
      expect(() =>
        loadApplicationConfig({
          ...validEnvironment(),
          JOURNEY_WINDOW_ZONE: "America/Nowhere",
        }),
      ).toThrow(/JOURNEY_WINDOW_ZONE/);
    });

    it("refuses an empty day list, which would close the journey forever", () => {
      expect(() =>
        loadApplicationConfig({
          ...validEnvironment(),
          JOURNEY_WINDOW_DAYS: "",
        }),
      ).toThrow(/JOURNEY_WINDOW_DAYS/);
    });

    it("refuses a time that is not a time of day", () => {
      expect(() =>
        loadApplicationConfig({
          ...validEnvironment(),
          JOURNEY_WINDOW_OPENS: "7h30",
        }),
      ).toThrow(/JOURNEY_WINDOW_OPENS/);
    });
  });

  it("applies safe defaults to optional settings", () => {
    const config = loadApplicationConfig({
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      JWT_SECRET: "a-secure-secret-with-at-least-32-characters",
    });

    expect(config).toMatchObject({
      nodeEnv: "development",
      port: 3001,
      corsOrigins: ["http://localhost:3000"],
      jwt: { expiresIn: "7d" },
      bcryptRounds: 12,
      throttle: { limit: 30, windowMs: 60_000 },
    });
  });

  it("accepts a short JWT secret only in the test environment", () => {
    const config = loadApplicationConfig({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      JWT_SECRET: "test-secret",
    });

    expect(config.jwt.secret).toBe("test-secret");
  });

  it("rejects a non-positive JWT expiration", () => {
    expect(() =>
      loadApplicationConfig({
        ...validEnvironment(),
        JWT_EXPIRES_IN: "0s",
      }),
    ).toThrow("JWT_EXPIRES_IN must be a positive duration");
  });

  it("reports every invalid setting in a single error", () => {
    const environment = validEnvironment();
    Object.assign(environment, {
      NODE_ENV: "staging",
      PORT: "0",
      DATABASE_URL: "mysql://localhost/database",
      CORS_ORIGINS: "not-an-origin,ftp://example.com",
      JWT_SECRET: "short",
      JWT_EXPIRES_IN: "tomorrow",
      BCRYPT_ROUNDS: "9.5",
      THROTTLE_LIMIT: "NaN",
      THROTTLE_WINDOW_MS: "-1",
    });

    expect(() => loadApplicationConfig(environment)).toThrow(
      ApplicationConfigError,
    );

    try {
      loadApplicationConfig(environment);
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationConfigError);
      expect((error as ApplicationConfigError).issues).toHaveLength(10);
    }
  });

  it("reports missing required settings together", () => {
    expect(() => loadApplicationConfig({})).toThrow(
      "Invalid application configuration:\n- DATABASE_URL is required\n- JWT_SECRET is required",
    );
  });
});
