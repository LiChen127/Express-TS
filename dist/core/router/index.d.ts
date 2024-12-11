/**
 * 路由器原型类
 * 管理路由注册和匹配
 * 管理路由中间件
 */
import { RouterPrototype, RouteOptions } from './type/route';
import { Request, Response, NextFunction } from '../type/index';
export default class Router implements RouterPrototype {
    private options;
    /**
     * 初始化参数
     * @param { Object } options 配置
     */
    private params;
    private _params;
    private stack;
    private strict;
    private mergeParams;
    private caseSensitive;
    constructor(options: RouteOptions);
    /**
     * 注册参数中间件
     * @param {*} name
     * @param {*} callback
     * @returns
     */
    param(name: string | Function, callback: (req: Request, res: Response, next: NextFunction) => void): void;
    /**
     * 遍历中间件堆栈根据请求执行这些中间件
     * @param req
     * @param res
     * @param next
     */
    private handle;
    /**
     * @description 添加方法到列表
     * @param {Array} list 列表
     * @param {string[]} methods 方法
     */
    private appendMethods;
    /**
     * 发送OPTIONS 响应
     * @param {Response} res 响应对象
     * @param {any[]} options 路由配置
     * @param {NextFunction} done 回调函数
     */
    private sendOptonsResponse;
    private next;
    /**
     * @description merge Function params
     * @param {*} params 参数
     * @param {*} parent 父级参数
     * @returns
     */
    private mergeParamsFn;
    /**
     * 获取协议和主机
     * @param {string} url 路径
     * @returns
     */
    private getProtohost;
    /**
     * 重构请求对象
     * @param next
     * @param req
     * @param keys
     * @returns
     */
    /**
     * 恢复对象的 props 后调用函数
     * @param {Function} fn 函数
     * @param {Object} obj 对象
     * @returns
     */
    private restore;
    /**
     * 包装中间件函数
     * @param {Function} old 原始函数，将要被包装的函数
     * @param {(any[]) => any} fn 包装函数，增强函数的功能
     * @returns
     */
    private wrap;
}
