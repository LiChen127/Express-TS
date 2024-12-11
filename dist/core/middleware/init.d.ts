import { Application, NextFunction, Request, Response } from '../type';
declare class Init {
    private app;
    constructor(app: Application);
    static expressInit(req: Request, res: Response, next: NextFunction): void;
}
declare const ExpressInit: typeof Init.expressInit;
export default ExpressInit;
