import FindUserByIdUseCase from "../../../usecase/find-by-id/find-by-id.usecase";
import { User } from "../../../domain/user.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { UserRole } from "@/modules/@shared/domain/enums";

const COMPANY_ID = "c0000000-0000-4000-8000-000000000000";

const makeSut = () => {
  const user = User.create({
    name: "Maria Souza",
    email: "maria@backend.com.br",
    password: "$2b$12$hashedpassword",
    role: UserRole.VIEWER,
    companyId: COMPANY_ID,
  });
  const userGateway = {
    findByIdInCompany: jest.fn().mockResolvedValue(user),
  };

  const useCase = new FindUserByIdUseCase(userGateway as any);

  return { useCase, user, userGateway };
};

describe("FindUserByIdUseCase", () => {
  it("returns the user entity", async () => {
    const { useCase, user, userGateway } = makeSut();

    const output = await useCase.execute({
      id: user.id,
      companyId: COMPANY_ID,
    });

    expect(userGateway.findByIdInCompany).toHaveBeenCalledWith(
      user.id,
      COMPANY_ID,
    );
    expect(output).toBe(user);
  });

  it("throws NotFoundError when user does not exist", async () => {
    const { useCase, userGateway } = makeSut();
    userGateway.findByIdInCompany.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: "b7e6a1c0-0000-4000-8000-000000000000",
        companyId: COMPANY_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
