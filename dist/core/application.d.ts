/// <reference types="node" />
/// <reference types="node" />
/**
 * Express应用主类
 * 中间件系统
 */
/**
 * 引入依赖
 */
import { EventEmitter } from 'events';
import { Request, Response } from './type/index';
import * as http from 'http';
/**
* Express-like Application class
* - Handles Middleware
* - Manages Settings
* - Processe Request/Response
*/
export declare class Application extends EventEmitter {
    private _router;
    request: Request;
    response: Response;
    settings: Map<string | symbol, any>;
    locals: Record<string, any>;
    engines: Map<string, any>;
    private cache;
    private mountpath;
    private _eventsCount;
    constructor();
    /**
     * 初始化应用实例
     */
    private init;
    /**
     * 默认配置
     */
    private defaultConfiguration;
    /**
     * Handle mount event and extends settings
     */
    private onMount;
    /**
     * Extend prototypes from parent application
     */
    private extendPorototype;
    /**
     * 延迟加载路由
     */
    /**
     * 一层优化: 改进router的加载
     * this._router 只需要首次访问时被初始化，且只有在需要路由功能时才会被加载
     * 确保use方法中懒加载路由器，避免重复初始化
     */
    private lazyRouter;
    /**
     * Middleware Mangement
     */
    /**
     * Register middleware
     * @param fn
     * @returns
     */
    use(...args: Function[]): this;
    /**
     * 处理HTTP请求
     */
    handle(req: Request, res: Response): void;
    /**
     * Execute middleware stack
     * @param req
     * @param res
     * @param done
     */
    private handleRequest;
    private route;
    /**
     * 注册模板引擎
     */
    private engine;
    /**
     * 注册参数中间件
     */
    private param;
    /**
     * set
     */
    private set;
    /**
     * path
     */
    private path;
    /**
     * enabled
     */
    private enabled;
    /**
     * disabled
     */
    private disabled;
    /**
     * enable
     */
    private enable;
    /**
     * disable
     */
    private disable;
    /**
     * 将HTTP 方法代理到路由器
     */
    private proxyMethod;
    /**
     * app.all
     */
    private all;
    /**
     * del
     */
    /**
     * render
     */
    render(name: string, options: any, callback: Function): void;
    /**
     * tryRender
     */
    private tryRender;
    /**
     * Start HTTP server
     * @param port
     * @param callback
     * @returns
     */
    listen(port: number, callback?: () => void): http.Server;
}
