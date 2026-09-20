import prisma from "@/infra/database/prisma.instance";
import SelfReportRepository from "@/modules/self-report/repository/self-report.repository";
import SavingsGoalRepository from "../repository/savings-goal.repository";
import CreateGoalUseCase from "../usecase/create-goal/create-goal.usecase";
import GetGoalsUseCase from "../usecase/get-goals/get-goals.usecase";
import ExtendGoalUseCase from "../usecase/extend-goal/extend-goal.usecase";
import EndGoalUseCase from "../usecase/end-goal/end-goal.usecase";
import SavingsGoalFacade from "../facade/savings-goal.facade";

export default class SavingsGoalFacadeFactory {
  static create(): SavingsGoalFacade {
    const savingsGoalRepository = new SavingsGoalRepository(prisma);
    // O cumprimento mensal deriva das declarações: get-goals lê o self-report,
    // sem duplicar nenhum dado.
    const selfReportRepository = new SelfReportRepository(prisma);
    return new SavingsGoalFacade(
      new CreateGoalUseCase(savingsGoalRepository),
      new GetGoalsUseCase(savingsGoalRepository, selfReportRepository),
      new ExtendGoalUseCase(savingsGoalRepository),
      new EndGoalUseCase(savingsGoalRepository),
    );
  }
}
