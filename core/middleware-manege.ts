import { RequestHandler, Request, Response } from "./type";

export class MiddlewareManager {
  private middleware: RequestHandler[] = [];

  public add(handler: RequestHandler) {
    this.middleware.push(handler);
  }

  public execute(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      let index = 0;

      const next = (err?: any): void => {
        if (err) {
          return reject(err);
        }

        if (index >= this.middleware.length) {
          return resolve();
        }

        const handler = this.middleware[index++];

        try {
          handler(req, res, next);
        } catch (error) {
          next(error);
        }
      }

      next();
    });
  }
}