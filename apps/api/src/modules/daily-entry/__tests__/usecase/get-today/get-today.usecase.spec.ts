import { DailyEntry } from "../../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../../gateway/daily-entry.gateway";
import GetTodayEntryUseCase from "../../../usecase/get-today/get-today.usecase";

const userId = "3f1b2c8e-0f4a-4a1a-9c7d-2f9a1b3c4d5e";
const companyId = "7a2c4d6e-1b3f-4c5d-8e9f-0a1b2c3d4e5f";
const lateInTheDay = new Date(Date.UTC(2026, 8, 19, 22, 40));

const gatewayWith = (existing: DailyEntry | null): DailyEntryGateway => ({
  findByDate: jest.fn().mockResolvedValue(existing),
  create: jest.fn(),
  update: jest.fn(),
});

describe("GetTodayEntryUseCase", () => {
  it("reports the day as unanswered so the screen asks", async () => {
    const output = await new GetTodayEntryUseCase(gatewayWith(null)).execute({
      userId,
      companyId,
      today: lateInTheDay,
    });

    expect(output.answered).toBe(false);
    expect(output.mood).toBeNull();
    expect(output.entryDate.toISOString()).toBe("2026-09-19T00:00:00.000Z");
  });

  it("reports the day as answered so the screen shows the app", async () => {
    const entry = DailyEntry.create({
      userId,
      companyId,
      entryDate: lateInTheDay,
      mood: 4,
    });

    const output = await new GetTodayEntryUseCase(gatewayWith(entry)).execute({
      userId,
      companyId,
      today: lateInTheDay,
    });

    expect(output.answered).toBe(true);
    expect(output.mood).toBe(4);
  });

  it("asks the gateway for the owner, never for the user alone", async () => {
    const gateway = gatewayWith(null);

    await new GetTodayEntryUseCase(gateway).execute({
      userId,
      companyId,
      today: lateInTheDay,
    });

    expect(gateway.findByDate).toHaveBeenCalledWith(
      { userId, companyId },
      new Date(Date.UTC(2026, 8, 19)),
    );
  });
});
