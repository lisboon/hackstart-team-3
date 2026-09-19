export class ConflictError extends Error {
  constructor(message: string = "The resource is already in this state") {
    super(message);
    this.name = "ConflictError";
  }
}
