import type { ContentPiece as ContentPieceModel } from "@prisma/client";
import { CoopsStage } from "@/modules/@shared/domain/enums";
import { ContentOption, ContentPiece } from "../domain/content-piece.entity";

export class ContentPieceModelMapper {
  static toEntity(data: ContentPieceModel): ContentPiece {
    return {
      id: data.id,
      stage: data.stage as CoopsStage,
      orderInStage: data.orderInStage,
      title: data.title,
      body: data.body,
      prompt: data.prompt,
      options: data.options as unknown as ContentOption[],
      sourceUrl: data.sourceUrl,
    };
  }
}
