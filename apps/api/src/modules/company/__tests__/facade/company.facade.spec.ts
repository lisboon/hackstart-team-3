import CompanyFacade from "../../facade/company.facade";
import { Company } from "../../domain/company.entity";

const makeSut = () => {
  const company = Company.create({ name: "Acme Corp", slug: "acme-corp" });

  const findCompanyByIdUseCase = {
    execute: jest.fn().mockResolvedValue(company),
  };
  const updateCompanyUseCase = {
    execute: jest.fn().mockResolvedValue(company.toJSON()),
  };
  const getUnitIndicatorsUseCase = {
    execute: jest.fn().mockResolvedValue({ suppressed: true }),
  };

  const facade = new CompanyFacade(
    findCompanyByIdUseCase as any,
    updateCompanyUseCase as any,
    getUnitIndicatorsUseCase as any,
  );

  return {
    facade,
    company,
    findCompanyByIdUseCase,
    updateCompanyUseCase,
    getUnitIndicatorsUseCase,
  };
};

describe("CompanyFacade", () => {
  it("findById delegates to use case and serializes the entity via toJSON", async () => {
    const { facade, company, findCompanyByIdUseCase } = makeSut();

    const output = await facade.findById({ id: company.id });

    expect(findCompanyByIdUseCase.execute).toHaveBeenCalledWith({
      id: company.id,
    });
    expect(output).toEqual(company.toJSON());
    expect(output).not.toBe(company);
  });

  it("update delegates to its use case", async () => {
    const { facade, updateCompanyUseCase } = makeSut();
    const input = { id: "id-1", name: "Updated" };

    await facade.update(input);

    expect(updateCompanyUseCase.execute).toHaveBeenCalledWith(input);
  });

  it("indicators delegates to its use case", async () => {
    const { facade, company, getUnitIndicatorsUseCase } = makeSut();
    const today = new Date(Date.UTC(2026, 8, 19));

    const output = await facade.indicators({ companyId: company.id, today });

    expect(getUnitIndicatorsUseCase.execute).toHaveBeenCalledWith({
      companyId: company.id,
      today,
    });
    expect(output).toEqual({ suppressed: true });
  });
});
