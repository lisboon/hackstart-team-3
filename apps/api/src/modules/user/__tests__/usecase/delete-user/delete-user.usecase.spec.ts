import DeleteUserUseCase from "../../../usecase/delete-user/delete-user.usecase";
import { User } from "../../../domain/user.entity";
import { NotFoundError } from "@/modules/@shared/domain/errors/not-found.error";
import { ForbiddenError } from "@/modules/@shared/domain/errors/forbidden.error";
import { UserRole } from "@/modules/@shared/domain/enums";

const COMPANY_ID = "c0000000-0000-4000-8000-000000000000";

const makeUser = (role: UserRole) =>
  User.create({
    name: "Maria Souza",
    email: "maria@backend.com.br",
    password: "$2b$12$hash",
    role,
    companyId: COMPANY_ID,
  });

const makeSut = ({
  user = makeUser(UserRole.EDITOR),
  activeAdmins = 2,
} = {}) => {
  const transactionContext = {};
  const transactionManager = {
    execute: jest
      .fn()
      .mockImplementation(async (fn: any) => fn(transactionContext)),
  };
  const userGateway = {
    findByIdInCompany: jest.fn().mockResolvedValue(user),
    countActiveAdmins: jest.fn().mockResolvedValue(activeAdmins),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new DeleteUserUseCase(
    transactionManager as any,
    userGateway as any,
  );

  return {
    useCase,
    user,
    transactionContext,
    transactionManager,
    userGateway,
  };
};

describe("DeleteUserUseCase", () => {
  it("soft deletes a non-admin user inside a serializable transaction", async () => {
    const {
      useCase,
      user,
      transactionContext,
      transactionManager,
      userGateway,
    } = makeSut();

    const output = await useCase.execute({
      id: user.id,
      companyId: COMPANY_ID,
    });

    expect(transactionManager.execute).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: "Serializable" },
    );
    expect(userGateway.findByIdInCompany).toHaveBeenCalledWith(
      user.id,
      COMPANY_ID,
      transactionContext,
    );
    expect(userGateway.update).toHaveBeenCalledWith(user, transactionContext);
    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(user.active).toBe(false);
    expect(output).toEqual({ id: user.id, deletedAt: user.deletedAt });
  });

  it("soft deletes an admin inside a serializable transaction", async () => {
    const admin = makeUser(UserRole.ADMIN);
    const { useCase, transactionContext, transactionManager, userGateway } =
      makeSut({ user: admin });

    await useCase.execute({ id: admin.id, companyId: COMPANY_ID });

    expect(transactionManager.execute).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: "Serializable",
      },
    );
    expect(userGateway.countActiveAdmins).toHaveBeenCalledWith(
      COMPANY_ID,
      transactionContext,
    );
    expect(admin.deletedAt).toBeInstanceOf(Date);
  });

  it("throws ForbiddenError when deleting the last active admin", async () => {
    const admin = makeUser(UserRole.ADMIN);
    const { useCase, userGateway } = makeSut({ user: admin, activeAdmins: 1 });

    await expect(
      useCase.execute({ id: admin.id, companyId: COMPANY_ID }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(userGateway.update).not.toHaveBeenCalled();
    expect(admin.deletedAt).toBeUndefined();
  });

  it("deletes an inactive admin in the same transaction without counting active admins", async () => {
    const admin = makeUser(UserRole.ADMIN);
    admin.deactivate();
    const { useCase, transactionContext, transactionManager, userGateway } =
      makeSut({
        user: admin,
        activeAdmins: 1,
      });

    await useCase.execute({ id: admin.id, companyId: COMPANY_ID });

    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(userGateway.countActiveAdmins).not.toHaveBeenCalled();
    expect(userGateway.update).toHaveBeenCalledWith(admin, transactionContext);
    expect(admin.deletedAt).toBeInstanceOf(Date);
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
