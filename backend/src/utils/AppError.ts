/**
 * Custom application error that carries an application status code.
 * Throw this from any Service layer method; the Router catches it
 * and returns the standard response envelope.
 */
export class AppError extends Error {
  constructor(
    public readonly status_code: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
