import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { ForbiddenError } from "@/modules/@shared/domain/errors/forbidden.error";
import { CompanyGateway } from "@/modules/company/gateway/company.gateway";
import {
  DEFAULT_JOURNEY_WINDOW,
  JourneyWindow,
  journeyWindowAt,
} from "@/modules/company/domain/journey-window";
import { normalizeToDayStart } from "@/modules/@shared/domain/utils/day";
import { DailyEntry } from "../../domain/daily-entry.entity";
import { DailyEntryGateway } from "../../gateway/daily-entry.gateway";
import {
  RecordMoodUseCaseInputDto,
  RecordMoodUseCaseInterface,
  RecordMoodUseCaseOutputDto,
} from "./record-mood.usecase.dto";

export default class RecordMoodUseCase implements RecordMoodUseCaseInterface {
  constructor(
    private readonly dailyEntryGateway: DailyEntryGateway,
    private readonly companyGateway: CompanyGateway,
    /**
     * A janela vem da unidade (#76). O padrão do processo é só o que vale para
     * empresa que nunca configurou a sua.
     */
    private readonly fallbackWindow: JourneyWindow = DEFAULT_JOURNEY_WINDOW,
  ) {}

  async execute(
    data: RecordMoodUseCaseInputDto,
  ): Promise<RecordMoodUseCaseOutputDto> {
    // A janela guarda a escrita, nao a porta: entrar, consultar e alcancar o
    // CVV seguem livres. Quem ja abriu a tela dentro da janela nao passa por
    // aqui depois do fechamento — a tela sabe do horario pelo GET /me/today, e
    // este 403 e a rede para quem tentar pelo DevTools.
    const window =
      (await this.companyGateway.findJourneyWindow(data.companyId)) ??
      this.fallbackWindow;
    if (!journeyWindowAt(data.entryDate, window).open) {
      throw new ForbiddenError(
        "The daily journey is open on working hours only",
      );
    }

    const owner = { userId: data.userId, companyId: data.companyId };
    const entryDate = normalizeToDayStart(data.entryDate);
    const existing = await this.dailyEntryGateway.findByDate(owner, entryDate);

    if (existing) {
      // Já houve declaração hoje: uma por dia, sem correção. A pergunta é como
      // a pessoa está agora, e reescrever convidaria a ajustar ao que ela acha
      // que deveria sentir. O dia seguinte é a próxima chance.
      if (existing.moodDeclared) {
        throw new ConflictError("Today is already answered");
      }
      // O humor era automático (a colheita abriu o dia). Agora a pessoa
      // declara de verdade: o real sobrescreve o neutro e passa a contar. A
      // nota opcional acompanha essa declaração.
      existing.changeMood(data.mood, data.note);
      await this.dailyEntryGateway.update(existing);
      return {
        entryDate: existing.entryDate,
        mood: existing.mood,
        note: existing.note ?? null,
      };
    }

    const entry = DailyEntry.create({
      ...owner,
      entryDate,
      mood: data.mood,
      note: data.note,
    });
    await this.dailyEntryGateway.create(entry);

    return {
      entryDate: entry.entryDate,
      mood: entry.mood,
      note: entry.note ?? null,
    };
  }
}
