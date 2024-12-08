'use strict';
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
import { resolve } from 'path';
import { View } from './view';
/**
 * 解引用
 */

/**
* Express-like Application class
* - Handles Middleware
* - Manages Settings
* - Processe Request/Response
*/
export class Application extends EventEmitter {
  private middleware: RequestHandler[];
  private readonly trustProxyDefaultSymbol = Symbol('trust_proxy_default');
  public request: Request;
  public response: Response;
  public settings: Record<string | symbol, any>;
  public locals: Record<string, any>;
  public engines: Map<string, any>;
  private mountpath: string;

  constructor() {
    super();
    this.middleware = [];
    this.settings = new Map();
    this.engines = new Map();
    this.locals = Object.create(null) as Record<string, any>;
    this.mountpath = '/';
    this.request = {} as Request;
    this.response = {} as Response;
    this.defaultConfiguration();
  }

  /**
   * Set a configuration setting
   * @param setting 
   * @param value 
   * @returns 
   */
  public set(setting: string, value: any): this {
    this.settings.set(setting, value);
    return this;
  }

  /**
   * Get a configuration setting
   * @param setting 
   * @returns 
   */
  public get(setting: string): any {
    return this.settings.get(setting);
  }

  /**
   * Enable a configuration setting
   * @param setting 
   * @returns 
   */
  public enable(setting: string): this {
    this.set(setting, true);
    return this;
  }

  /**
   * Disable a configuration setting
   * @param setting 
   * @returns 
   */
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

    this.locals.settings = this.settings;
    this.settings.set(this.trustProxyDefaultSymbol, false);

    this.on('mount', this.onMount.bind(this));

    /** 设置本地变量 */
    this.locals = Object.create(null) as Record<string, any>;
    /** 挂载应用 */
    this.mountpath = '/';
    /** 默认本地变量 */
    this.locals.settings = this.settings;
    /** 配置 */
    // @todo 设置视图引擎
    this.set('view', View);
    // @doto 设置views 文件resolve
    this.set('views', resolve(__dirname, 'views'));
    this.set('json callback name', 'callback');

    /** 是否开启视图缓存 */
    if (env === 'production') {
      this.enable('view cache');
    }

    /**
     * 定义router的get修饰符
     */
    Object.defineProperty(this, 'router', {
      get() {
        throw new Error('Router is not available on the application instance');
      }
    })
  }

  /**
   * Handle mount event and extends settings
   */
  private onMount(parent: Application): void {
    if (this.settings.get(this.trustProxyDefaultSymbol) === true && typeof parent.settings.get('trust proxy fn') === 'function') {
      this.settings.delete('trust proxy');
      this.settings.delete('trust proxy fn');
    }
    this.extendPorototype(parent);
  }
  /**
   * Extend prototypes from parent application
   */
  private extendPorototype(parent: Application): void {
    Object.setPrototypeOf(this.request, parent.request);
    Object.setPrototypeOf(this.response, parent.response);
    Object.setPrototypeOf(this.engines, parent.engines);
    Object.setPrototypeOf(this.settings, parent.settings);
  }
  /**
   * Middleware Mangement
   */
  /**
   * Register middleware
   * @param fn 
   * @returns 
   */
  public use(fn: RequestHandler): this {
    this.middleware.push(fn);
    return this;
  }
  /**
   * Handle incoming HTTP request
   */
  public handle(req: Request, res: Response): void {
    const request = req as Request;
    const response = res as Response;
    this.handleRequest(request, response, (err?: any) => {
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
  /**
   * Execute middleware stack
   * @param req 
   * @param res 
   * @param done 
   */
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
  /**
   * Start HTTP server
   * @param port 
   * @param callback 
   * @returns 
   */
  public listen(port: number, callback?: () => void): http.Server {
    return http.createServer((req, res) => this.handle(req, res)).listen(port, callback);
  }
}
