import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ConflictError } from "@/modules/@shared/domain/errors/conflict.error";
import { sendHttpError } from "./http-error-response";

@Catch(ConflictError, ConflictException)
export class ConflictErrorFilter implements ExceptionFilter {
  catch(exception: ConflictError | ConflictException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    sendHttpError(response, HttpStatus.CONFLICT, "Conflict", exception.message);
  }
}
