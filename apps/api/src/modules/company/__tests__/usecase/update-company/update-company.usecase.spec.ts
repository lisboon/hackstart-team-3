import UpdateCompanyUseCase from "../../../usecase/update-company/update-company.usecase";
import { Company } from "../../../domain/company.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { EntityValidationError } from "@/modules/@shared/domain/errors/validation.error";
import { companyGatewayDouble } from "../../company-gateway.double";

const makeCompany = () =>
  Company.create({ name: "Acme Corp", slug: "acme-corp" });

const makeSut = ({ company = makeCompany() } = {}) => {
  const companyGateway = companyGatewayDouble({
    findById: jest.fn().mockResolvedValue(company),
    findBySlug: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
    replaceJourneyShifts: jest.fn().mockResolvedValue(undefined),
  });

  const useCase = new UpdateCompanyUseCase(companyGateway);

  return { useCase, company, companyGateway };
};

describe("UpdateCompanyUseCase", () => {
  it("updates name and persists", async () => {
    const { useCase, company, companyGateway } = makeSut();

    const output = await useCase.execute({ id: company.id, name: "Acme Inc" });

    expect(companyGateway.update).toHaveBeenCalledTimes(1);
    expect(output.name).toBe("Acme Inc");
  });

  it("toggles active", async () => {
    const { useCase, company } = makeSut();

    const output = await useCase.execute({ id: company.id, active: false });

    expect(output.active).toBe(false);
  });

  it("throws NotFoundError when company does not exist", async () => {
    const { useCase, companyGateway } = makeSut();
    companyGateway.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: "b7e6a1c0-0000-4000-8000-000000000000" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws EntityValidationError when new slug belongs to another company", async () => {
    const { useCase, company, companyGateway } = makeSut();
    companyGateway.findBySlug.mockResolvedValue({ id: "another-id" } as never);

    await expect(
      useCase.execute({ id: company.id, slug: "taken-slug" }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });

  it("allows keeping the same slug", async () => {
    const { useCase, company, companyGateway } = makeSut();

    await useCase.execute({ id: company.id, slug: "acme-corp" });

    expect(companyGateway.findBySlug).not.toHaveBeenCalled();
    expect(companyGateway.update).toHaveBeenCalledTimes(1);
  });

  describe("the journey window of the unit", () => {
    it("turns the clock into minutes before writing", async () => {
      const { useCase, company, companyGateway } = makeSut();

      await useCase.execute({
        id: company.id,
        journeyShifts: [
          { weekday: 1, opensAt: "22:00", closesAt: "24:00" },
          { weekday: 2, opensAt: "00:00", closesAt: "06:00" },
        ],
      });

      expect(companyGateway.replaceJourneyShifts).toHaveBeenCalledWith(
        company.id,
        [
          { weekday: 1, opensAt: 1320, closesAt: 1440 },
          { weekday: 2, opensAt: 0, closesAt: 360 },
        ],
      );
    });

    it("leaves the shifts alone when the request does not mention them", async () => {
      const { useCase, company, companyGateway } = makeSut();

      await useCase.execute({ id: company.id, name: "Acme Inc" });

      expect(companyGateway.replaceJourneyShifts).not.toHaveBeenCalled();
    });

    it("refuses a shift that closes before it opens", async () => {
      // Turno da noite sao duas faixas em dias diferentes. Uma faixa
      // invertida e engano, e engano nao vira janela.
      const { useCase, company } = makeSut();

      await expect(
        useCase.execute({
          id: company.id,
          journeyShifts: [{ weekday: 1, opensAt: "18:00", closesAt: "07:30" }],
        }),
      ).rejects.toBeInstanceOf(EntityValidationError);
    });

    it("writes nothing when one shift in the list is invalid", async () => {
      const { useCase, company, companyGateway } = makeSut();

      await expect(
        useCase.execute({
          id: company.id,
          journeyShifts: [
            { weekday: 1, opensAt: "07:30", closesAt: "18:00" },
            { weekday: 2, opensAt: "07:30", closesAt: "nope" },
          ],
        }),
      ).rejects.toBeInstanceOf(EntityValidationError);

      expect(companyGateway.update).not.toHaveBeenCalled();
      expect(companyGateway.replaceJourneyShifts).not.toHaveBeenCalled();
    });

    it("refuses a zone that does not exist", async () => {
      const { useCase, company } = makeSut();

      await expect(
        useCase.execute({ id: company.id, journeyZone: "America/Nowhere" }),
      ).rejects.toBeInstanceOf(EntityValidationError);
    });
  });
});
