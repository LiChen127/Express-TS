/**
 * Express应用主类
 * 中间件系统
 */
/**
 * 引入依赖
 */
import { EventEmitter } from 'events';
import { IncomingMessage, ServerResponse } from 'http';
import { Request, Response, NextFunction, RequestHandler } from './type/index';
import * as http from 'http';

export class Application extends EventEmitter {
  private middleware: RequestHandler[];
  public request: Request;
  public response: Response;
  public settings: Map<string, any>;
  public locals: any;
  public engines: Map<string, any>;
  private mountpath: string;

  constructor() {
    super();
    this.middleware = [];
    this.settings = new Map();
    this.engines = new Map();
    this.locals = Object.create(null);
    this.mountpath = '/';
    this.defaultConfiguration();
  }

  // 配置方法
  public set(setting: string, value: any): this {
    this.settings.set(setting, value);
    return this;
  }

  public get(setting: string): any {
    return this.settings.get(setting);
  }

  public enable(setting: string): this {
    this.set(setting, true);
    return this;
  }

  public disable(setting: string): this {
    this.set(setting, false);
    return this;
  }

  private defaultConfiguration(): void {
    const env = process.env.NODE_ENV || 'development';

    this.enable('x-powered-by');
    this.set('etag', 'weak');
    this.set('env', env);
    this.set('query parser', 'extended');
    this.set('subdomain offset', 2);
    this.set('trust proxy', false);

    // 设置locals
    this.locals.settings = this.settings;
  }

  public use(fn: RequestHandler): this {
    this.middleware.push(fn);
    return this;
  }

  private handleRequest(req: Request, res: Response, done: NextFunction): void {
    let index = 0;

    const next = (err?: any) => {
      if (err) {
        return done(err);
      }

      if (index >= this.middleware.length) {
        return done();
      }

      const handler = this.middleware[index++];

      try {
        handler(req, res, next);
      } catch (err) {
        next(err);
      }
    }

    next();
  }

  public handle(req: Request, res: Response): void {
    this.handleRequest(req, res, (err?: any) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Internal Server Error: ${err.message}`);
        return;
      }

      if (!res.writableEnded) {
        res.statusCode = 404;
        res.end('Not Found');
      }
    });
  }

  public listen(port: number, callback?: () => void): http.Server {
    return http
      .createServer(this.handle.bind(this))
      .listen(port, callback);
  }
}
