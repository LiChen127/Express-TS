import { RequestHandler, Request, Response } from "./type";
export declare class MiddlewareManager {
    private middleware;
    add(handler: RequestHandler): void;
    execute(req: Request, res: Response): Promise<void>;
}
