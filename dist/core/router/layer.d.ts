import { NextFunction, Request, Response, RequestHandler } from '../type';
export default class Layer {
    private path;
    private regexp;
    private name;
    handle: RequestHandler;
    private keys;
    private opts;
    private params;
    method: string | undefined;
    constructor(path: string, options: any, fn: RequestHandler);
    handle_error(err: any, req: Request, res: Response, next: NextFunction): void;
    handle_request(req: Request, res: Response, next: NextFunction): void;
    private match;
    private decode_param;
}
