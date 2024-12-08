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
import { Router } from './router';
import { flatten } from 'array-flatten';
import { View } from './view';
import { compileETag, compileQueryParser, compileTrust } from './utils';
/**
 * 解引用
 */
const slice = Array.prototype.slice;
const setPrototypeOf = Object.setPrototypeOf;
/**
* Express-like Application class
* - Handles Middleware
* - Manages Settings
* - Processe Request/Response
*/
export class Application extends EventEmitter {
  private _router: Router;
  public request: Request;
  public response: Response;
  public settings: Map<string | symbol, any>;
  public locals: Record<string, any>;
  public engines: Map<string, any>;
  private cache: Record<string, any>;
  private mountpath: string;
  private _eventsCount: number;

  constructor() {
    super();
    this.init();
  }

  /**
   * 初始化应用实例
   */
  private init(): void {
    this.cache = {};
    this.settings = new Map();
    this.engines = new Map();
    this.locals = Object.create(null);
    this._router = null;
    this.mountpath = '/';
    this._eventsCount = 0;
    this.defaultConfiguration();
  }

  /**
   * 默认配置
   */
  private defaultConfiguration(): void {
    const env = process.env.NODE_ENV || 'development';

    // 基础配置
    this.enable('x-powered-by');
    this.set('etag', 'weak');
    this.set('env', env);
    this.set('query parser', 'extended');
    this.set('subdomain offset', 2);
    this.set('trust proxy', false);

    // 视图相关配置
    this.set('view', View);
    this.set('views', process.cwd() + '/views');
    this.set('jsonp callback name', 'callback');

    if (env === 'production') {
      this.enable('view cache');
    }

    // 设置locals
    this.locals.settings = this.settings;
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
    setPrototypeOf(this.request, parent.request);
    setPrototypeOf(this.response, parent.response);
    setPrototypeOf(this.engines, parent.engines);
    setPrototypeOf(this.settings, parent.settings);
  }
  /**
   * 延迟加载路由
   */
  /**
   * 一层优化: 改进router的加载
   * this._router 只需要首次访问时被初始化，且只有在需要路由功能时才会被加载
   * 确保use方法中懒加载路由器，避免重复初始化
   */
  private lazyRouter(): void {
    if (!this._router) {
      this._router = new Router({
        caseSensitive: this.enabled('case sensitive routing'),
        strict: this.enabled('strict routing')
      });
    }
    /**
     * 解析query
     */
    this._router.use(query(this.get('query parser fn')));
    /**
     * 初始化中间件
     */
    // this._router.use(this.middleware.init(this));
  }
  /**
   * Middleware Mangement
   */
  /**
   * Register middleware
   * @param fn 
   * @returns 
   */
  public use(...args: Function[]): this {
    // this.middleware.push(fn);
    // return this;
    let path = '/';
    let fns: Function[] = args;

    if (typeof args[0] === 'string') {
      path = args.shift() as string;
    }

    fns = flatten(fns);
    this.lazyRouter();

    const router = this._router;

    fns.forEach((fn) => {
      if (!fn || !fn.handle || !fn.set) {
        return router.use(path, fn);
      }

      fn.moutpath = this.path;
      fn.parent = this;

      router.use(path, (req, res, next) => {
        const orig = req.app;
        fn.handle(req, res, (err?: any) => {
          setPrototypeOf(req, orig.request);
          setPrototypeOf(res, orig.response);
          next(err);
        });
      });
      fn.emit('mount', this);
    });

    return this;
  }
  /**
   * 处理HTTP请求
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

      // 404处理
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
  // @todo: 完善Router
  private route(path: string): Router {
    this.lazyRouter();
    return this._router.route(path);
  }
  /**
   * 注册模板引擎
   */
  private engine(ext: string, fn: Function): this {
    if (typeof fn !== 'function') {
      throw new Error('Callback must be a function');
    }
    const extentions = ext[0] !== '.' ? '.' + ext : ext;
    this.engines.set(extentions, fn);
    return this;
  }
  /**
   * 注册参数中间件
   */
  private param(name: string | string[], fn: Function): this {
    this.lazyRouter();
    if (Array.isArray(name)) {
      name.forEach((n) => {
        this._router.param(n, fn);
      });
    } else {
      this._router.param(name, fn);
    }
    return this;
  }
  /**
   * set
   */

  private set(setting: string, value?: any): string | undefined | this {
    if (arguments.length === 1) {
      let settings = this.settings;
      while (settings && settings !== Object.prototype) {
        if (Object.prototype.hasOwnProperty.call(settings, setting)) {
          // return settings[setting];
          return settings.get(setting);
        }
        settings = Object.getPrototypeOf(settings);
      }
      return undefined;
    }

    this.settings.set(setting, value);

    switch (setting) {
      case 'etag':
        this.set('etag fn', compileETag(value));
        break;
      case 'query parser':
        this.set('query parser fn', compileQueryParser(value));
        break;
      case 'trust proxy':
        this.set('trust proxy fn', compileTrust(value));
        // 兼容老版本
        Object.defineProperty(this, 'trust proxy', {
          value: value,
          writable: true
        });
        break;
    }

    return this;
  }

  /**
   * path
   */
  private path(): string {
    // @todo: 完善parent
    return this.parent ? this.parent.path() + this.mountpath : this.mountpath;
  }

  /**
   * enabled
   */
  private enabled(setting: string): boolean {
    return Boolean(this.set(setting));
  }

  /**
   * disabled
   */
  private disabled(setting: string): boolean {
    return !this.enabled(setting);
  }

  /**
   * enable
   */
  private enable(setting: string): string | undefined | this {
    return this.set(setting, true);
  }

  /**
   * disable
   */
  private disable(setting: string): string | undefined | this {
    return this.set(setting, false);
  }
  /**
   * 将HTTP 方法代理到路由器
   */
  private proxyMethod(method: string): void {
    this[method] = (path: string, ...fns: Function[]) => {
      if (method === 'get' && arguments.length === 1) {
        return this.set(path);
      }
      this.lazyRouter();
      const route = this._router.route(path);

      // route[method].apply(route, slice.call(arguments, 1));
      route[method](...fns);

      return this;
    }
  }
  /**
   * app.all
   */
  private all(path: string) {
    this.lazyRouter();
    const route = this._router.route(path);

    const args = slice.call(arguments, 1);

    methods.forEach((method) => {
      route[method].apply(route, args);
    });

    return this;
  }
  /**
   * del
   */
  // private del(path)

  /**
   * render
   */
  public render(name: string, options: any, callback: Function): void {
    const cache = this.cache;
    let done = callback || (() => { });;
    const engines = this.engines;
    let opts = options || {};
    let renderOpts = {};
    let view;

    /**
     * 支持回调函数为第二个参数
     * 如果options是一个函数， 说明cb是done = options 将opts设置为空对象
     */
    if (typeof options === 'function') {
      done = options;
      opts = {};
    }

    // merge
    merge(renderOpts, this.locals);

    if (opts.locals) {
      merge(renderOpts, opts.locals);
    }

    if (renderOpts.cache === null) {
      renderOpts.cache = this.enabled('view cache');
    }

    if (renderOpts.cache) {
      view = cache[name];
    }

    if (!view) {
      const View = this.get('view');

      view = new View(name, {
        defaultEngine: this.get('view engine'),
        root: this.get('views'),
        engines: engines
      });
    }

    if (!view.path) {
      const dir = Array.isArray(view.root) && view.root.length > 1
        ? 'directories "' + view.root.slice(0, -1).join('", "') + '" or "' + view.root[view.root.length - 1] + '"'
        : 'directory "' + view.root + '"';

      const err = new Error(`Failed to lookup view "${name}" in ${dir}`);
      done(err);
      return;
    }

    if (renderOpts.cache) {
      cache[name] = view;
    }

    this.tryRender(view, renderOpts, done);
  }
  /**
   * tryRender
   */
  private tryRender(view: View, renderOpts: any, done: Function): void {
    try {
      view.render(renderOpts, done);
    } catch (error) {
      done(error);
    }
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

/**
 * 初始化中间件
 */
function init(app: Application): RequestHandler {
  return function expressInit(req: Request, res: Response, next: NextFunction): void {
    req.res = res;
    res.req = req;
    req.app = app;
    res.app = app;
    next();
  };
}

/**
 * 查询字符串解析中间件
 */
function query(options: any): RequestHandler {
  const queryParser = options.queryParser || require('qs').parse;

  return function parseQuery(req: Request, res: Response, next: NextFunction): void {
    if (!req.query) {
      const queryString = req.url.split('?')[1] || '';
      req.query = queryParser(queryString, options);
    }
    next();
  };
}
