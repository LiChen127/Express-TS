import { Request, Response, NextFunction, RequestHandler } from '../type/index';
export default class Route {
    private path;
    private stack;
    private methods;
    constructor(path: string);
    /**
     * 添加处理方法
     */
    _handles_method(method: string): boolean;
    options(): void;
    /**
     * 添加中间件
     */
    dispatch(req: Request, res: Response, done: NextFunction): void;
    /**
     * 添加处理函数
     */
    handle(method: string, handlers: RequestHandler[]): this;
    /**
     * 支持的 HTTP 方法
     */
    all(handlers: RequestHandler[]): this;
}
