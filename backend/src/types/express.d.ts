export {};

declare global {
  namespace Express {
    interface Request {
      /** Attached by the `authenticate` middleware after JWT is verified */
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}
