'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
/**
 * Express应用主类
 * 中间件系统
 */
/**
 * 引入依赖
 */
const events_1 = require("events");
const http = __importStar(require("http"));
const router_1 = require("./router");
const array_flatten_1 = require("array-flatten");
const view_1 = require("./view");
const utils_1 = require("./utils");
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
class Application extends events_1.EventEmitter {
    constructor() {
        super();
        this.init();
    }
    /**
     * 初始化应用实例
     */
    init() {
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
    defaultConfiguration() {
        const env = process.env.NODE_ENV || 'development';
        // 基础配置
        this.enable('x-powered-by');
        this.set('etag', 'weak');
        this.set('env', env);
        this.set('query parser', 'extended');
        this.set('subdomain offset', 2);
        this.set('trust proxy', false);
        // 视图相关配置
        this.set('view', view_1.View);
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
    onMount(parent) {
        if (this.settings.get(this.trustProxyDefaultSymbol) === true && typeof parent.settings.get('trust proxy fn') === 'function') {
            this.settings.delete('trust proxy');
            this.settings.delete('trust proxy fn');
        }
        this.extendPorototype(parent);
    }
    /**
     * Extend prototypes from parent application
     */
    extendPorototype(parent) {
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
    lazyRouter() {
        if (!this._router) {
            this._router = new router_1.Router({
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
    use(...args) {
        // this.middleware.push(fn);
        // return this;
        let path = '/';
        let fns = args;
        if (typeof args[0] === 'string') {
            path = args.shift();
        }
        fns = (0, array_flatten_1.flatten)(fns);
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
                fn.handle(req, res, (err) => {
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
    handle(req, res) {
        const request = req;
        const response = res;
        this.handleRequest(request, response, (err) => {
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
    handleRequest(req, res, done) {
        let index = 0;
        const next = (err) => {
            if (err) {
                return done(err);
            }
            if (index >= this.middleware.length) {
                return done();
            }
            const handler = this.middleware[index++];
            try {
                handler(req, res, next);
            }
            catch (err) {
                next(err);
            }
        };
        next();
    }
    // @todo: 完善Router
    route(path) {
        this.lazyRouter();
        return this._router.route(path);
    }
    /**
     * 注册模板引擎
     */
    engine(ext, fn) {
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
    param(name, fn) {
        this.lazyRouter();
        if (Array.isArray(name)) {
            name.forEach((n) => {
                this._router.param(n, fn);
            });
        }
        else {
            this._router.param(name, fn);
        }
        return this;
    }
    /**
     * set
     */
    set(setting, value) {
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
                this.set('etag fn', (0, utils_1.compileETag)(value));
                break;
            case 'query parser':
                this.set('query parser fn', (0, utils_1.compileQueryParser)(value));
                break;
            case 'trust proxy':
                this.set('trust proxy fn', (0, utils_1.compileTrust)(value));
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
    path() {
        // @todo: 完善parent
        return this.parent ? this.parent.path() + this.mountpath : this.mountpath;
    }
    /**
     * enabled
     */
    enabled(setting) {
        return Boolean(this.set(setting));
    }
    /**
     * disabled
     */
    disabled(setting) {
        return !this.enabled(setting);
    }
    /**
     * enable
     */
    enable(setting) {
        return this.set(setting, true);
    }
    /**
     * disable
     */
    disable(setting) {
        return this.set(setting, false);
    }
    /**
     * 将HTTP 方法代理到路由器
     */
    proxyMethod(method) {
        this[method] = (path, ...fns) => {
            if (method === 'get' && arguments.length === 1) {
                return this.set(path);
            }
            this.lazyRouter();
            const route = this._router.route(path);
            // route[method].apply(route, slice.call(arguments, 1));
            route[method](...fns);
            return this;
        };
    }
    /**
     * app.all
     */
    all(path) {
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
    render(name, options, callback) {
        const cache = this.cache;
        let done = callback || (() => { });
        ;
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
    tryRender(view, renderOpts, done) {
        try {
            view.render(renderOpts, done);
        }
        catch (error) {
            done(error);
        }
    }
    /**
     * Start HTTP server
     * @param port
     * @param callback
     * @returns
     */
    listen(port, callback) {
        return http.createServer((req, res) => this.handle(req, res)).listen(port, callback);
    }
}
exports.Application = Application;
/**
 * 初始化中间件
 */
function init(app) {
    return function expressInit(req, res, next) {
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
function query(options) {
    const queryParser = options.queryParser || require('qs').parse;
    return function parseQuery(req, res, next) {
        if (!req.query) {
            const queryString = req.url.split('?')[1] || '';
            req.query = queryParser(queryString, options);
        }
        next();
    };
}
