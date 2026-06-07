export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly payload?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
