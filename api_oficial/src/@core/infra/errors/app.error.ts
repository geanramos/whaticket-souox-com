export class AppError extends Error {
  public message: string;
  public code: number;

  constructor(message: string, code = 400) {
    super(message);
    this.message = message;
    this.code = code;
  }
}
