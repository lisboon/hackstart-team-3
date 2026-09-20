import FindCompanyByIdUseCase from "../../../usecase/find-by-id/find-by-id.usecase";
import { Company } from "../../../domain/company.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { companyGatewayDouble } from "../../company-gateway.double";

const makeSut = () => {
  const company = Company.create({ name: "Acme Corp", slug: "acme-corp" });
  const companyGateway = companyGatewayDouble({
    findById: jest.fn().mockResolvedValue(company),
  });

  const useCase = new FindCompanyByIdUseCase(companyGateway);

  return { useCase, company, companyGateway };
};

describe("FindCompanyByIdUseCase", () => {
  it("returns the company with its journey window", async () => {
    const { useCase, company, companyGateway } = makeSut();
    companyGateway.findJourneyWindow.mockResolvedValue({
      zone: "America/Belem",
      shifts: [{ weekday: 1, opensAt: 450, closesAt: 1080 }],
    });

    const output = await useCase.execute({ id: company.id });

    expect(companyGateway.findById).toHaveBeenCalledWith(company.id);
    expect(output).toMatchObject({
      id: company.id,
      name: "Acme Corp",
      journeyShifts: [{ weekday: 1, opensAt: "07:30", closesAt: "18:00" }],
    });
  });

  it("reports an empty window when the unit never configured one", async () => {
    // Lista vazia e a verdade: nao ha configuracao desta unidade, e quem
    // escreve a diaria cai no padrao do processo.
    const { useCase, company } = makeSut();

    const output = await useCase.execute({ id: company.id });

    expect(output.journeyShifts).toEqual([]);
  });

  it("throws NotFoundError when company does not exist", async () => {
    const { useCase, companyGateway } = makeSut();
    companyGateway.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: "b7e6a1c0-0000-4000-8000-000000000000" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
