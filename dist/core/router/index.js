"use strict";
/**
 * 路由器原型类
 * 管理路由注册和匹配
 * 管理路由中间件
 */
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const index_1 = require("../utils/index");
const objectRegExp = /^\[object (\S+)]\$/;
const slice = Array.prototype.slice;
const toString = Object.prototype.toString;
function isObject(val) {
    return toString.call(val) === '[object Object]';
}
class Router {
    constructor(options) {
        this.options = {};
        /**
         * 初始化参数
         * @param { Object } options 配置
         */
        // 路由参数中间件
        this.params = {};
        // 全局参数中间件
        this._params = [];
        // 路由栈
        this.stack = [];
        // 严格模式
        this.strict = false;
        // 是否合并父路由参数
        this.mergeParams = false;
        // 是否区分大小写
        this.caseSensitive = false;
        this._params = options.params || [];
        this.stack = options.stack || [];
        this.strict = options.strict || false;
        this.mergeParams = options.mergeParams || false;
        this.caseSensitive = options.caseSensitive || false;
    }
    /**
     * 注册参数中间件
     * @param {*} name
     * @param {*} callback
     * @returns
     */
    param(name, callback) {
        /**
         * 这里处理全局的参数中间件
         */
        if (typeof name === 'function') {
            console.warn('router.param(fn): Refactor to use path params');
            // 将name中间件函数push到_params中
            this._params.push(name);
            return;
        }
        /**
         * 获取参数
         */
        const params = this._params;
        const len = params.length;
        let ret = null;
        /**
         * validate params name
         */
        if (name[0] === ':') {
            // throw new Error('Invalid router param name, param name can not start with ":"');
            console.warn('Invalid router param name, param name can not start with ":"');
            // 帮助用户去除错误字符
            name = name.slice(1);
        }
        /**
         * 遍历中间件
         */
        this._params.forEach((paramMiddleware) => {
            callback = paramMiddleware(name, callback);
        });
        if (typeof callback !== 'function') {
            throw new Error(`${callback} is not a function`);
        }
        /**
         * 如果没有匹配的中间件，注册新的callback
         */
        (this.params[name] = this.params[name] || []).push(callback);
        return;
    }
    /**
     * 遍历中间件堆栈根据请求执行这些中间件
     * @param req
     * @param res
     * @param next
     */
    handle(req, res, out) {
        // 中间件索引
        let index = 0;
        // 获取协议和主机
        const protohost = this.getProtohost(req.url);
        /**
         * 要移除的路径
         */
        let removed = '';
        /**
         * 是否添加//
         */
        let slashAdded = false;
        /**
         * 处理执行的同步和一步逻辑
         */
        let sync = 0;
        /**
         * 调用的参数 用Map吧
         */
        const paramCalled = new Map();
        /**
         * 获取请求方法
         * @todo: 这里需要去确定好数据结构
         */
        const options = [];
        /**
         * 获取路由堆栈
         */
        const stack = this.stack;
        /**
         * 获取父级的参数
         */
        const parentParams = req.params;
        /**
         * BASEURL
         */
        const parentUrl = req.baseUrl || '';
        /**
         * 获取最终的处理结果
         */
        let done = this.restore(out, req, 'baseUrl', 'next', 'params');
        req.baseUrl = parentUrl;
        req.originalUrl = req.url;
        /**
         * 如果请求方法是 OPTIONS，则直接执行done
         */
        if (req.method === 'OPTIONS') {
            done = this.wrap(done, (old, err) => {
                if (err || options.length === 0) {
                    return old(err);
                }
                this.sendOptonsResponse(res, options, old);
            });
        }
        next();
        function next(err) {
            const layerError = err === 'route' ? null : err;
            // 如果添加了//，则去除
            if (slashAdded) {
                req.url = req.url.slice(1);
                slashAdded = false;
            }
            /**
             * 如果removed长度不为0，则重构req.baseUrl和req.url
             */
            if (removed.length !== 0) {
                req.baseUrl = parentUrl;
                // 如果协议和host不存在，则直接拼接
                req.url = protohost === undefined ? removed + req.url : protohost + removed + req.url.slice(protohost.length);
                removed = '';
            }
            /**
             * 如果layerError不是router，则调用done
             */
            if (layerError === 'router') {
                // // 调用立即执行方法
                (0, process_1.nextTick)(done, null);
                return;
            }
            /**
             * 如果index大于等于stack长度，则调用done
             */
            if (index >= stack.length) {
                (0, process_1.nextTick)(done, layerError);
                return;
            }
            /**
             * 如果sync大于100，则调用next
             */
            if (++sync > 100) {
                return (0, process_1.nextTick)(next, err);
            }
            const path = getPathname(req);
            if (path === null ?  : ) {
                return done(layerError);
            }
            // let match = false;
            // let route;
            /**
             * 查找下一层匹配
             */
            let match = false;
            let route;
            let layer;
            /**
             * 遍历堆栈
             */
            while (!match && index < stack.length) {
                // 获取当前层
                const layer = stack[index++];
                // 匹配当前层
                match = matchLayer(layer, path);
                // 获取当前层的路由
                route = layer.route;
                if (typeof match !== 'boolean') {
                    layerError = match || layerError;
                }
                /**
                 * 如果匹配失败，则继续遍历
                 */
                if (!match || !route) {
                    continue;
                }
                /**
                 * 如果layerError存在，则设置match为false
                 */
                if (layerError) {
                    match = false;
                    continue;
                }
                /**
                 * 获取请求方法
                 */
                const method = req.method;
                /**
                 * ��断方法是否存在
                 */
                const hasMethod = route._handles_method(method);
                /**
                 * 如果方法不存在，并且请求方法是OPTIONS，则设置match为false
                 */
                if (!hasMethod && method === 'OPTIONS') {
                    // match = false;
                    options.push(...route._options());
                }
                /**
                 * 如果方法不存在，并且请求方法不是HEAD，则设置match为false
                 */
                if (!hasMethod && method !== 'HEAD') {
                    match = false;
                }
                if (!match) {
                    return done(layerError);
                }
                /**
                 * 如果route存在，则设置req.route
                 */
                if (route) {
                    req.route = route;
                }
                /**
                 * 设置req.params
                 */
                req.params = this.mergeParams ? mergeParams(layer.params, parentParams) : layer.params;
                /**
                 * 获取当前层的路径
                 */
                const layerPath = layer.path;
                /**
                 * 处理参数错误回调
                 */
                const processParamErrorCallback = (err) => {
                    if (err) {
                        next(layerError || err);
                    }
                    else if (route) {
                        layer.handle_request(req, res, next);
                    }
                    else {
                        this.trimPrefix(layer, layerPath, protohost, path);
                    }
                };
                /**
                 * 处理参数
                 */
                this.processParams(layer, paramCalled, req, res, processParamErrorCallback);
                // reset sync
                sync = 0;
            }
        }
        /**
         * 处理前缀
         * @param layer 层
         * @param layerError 错误
         * @param layerPath 层路径
         * @param path 路径
         */
        function trimPrefix(layer, layerError, layerPath, path) {
            if (layerPath.length !== 0) {
                if (layerPath !== path.slice(0, layerPath.length)) {
                    next(layerError);
                    return;
                }
            }
            /**
             * 获取下一层字符
             */
            const nextChar = path[layerPath.length] || '';
            /**
             * 如果下一层字符不是/或.，则调用next
             */
            if (nextChar && nextChar !== '/' && nextChar !== '.') {
                return next(layerError);
            }
            removed = layerPath;
            req.url = protohost ? protohost + req.url.slice(protohost.length + removed.length) : req.url.slice(removed.length);
            /**
             * 如果协议和主机不存在，并且请求路径不是以/开头，则添加/
             */
            if (!protohost && req.url[0] !== '/') {
                req.url = '/' + req.url;
                slashAdded = true;
            }
            /**
             * 设置baseUrl
             */
            req.baseUrl = parentUrl + (removed[removed.length - 1] === '/' ? removed.slice(0, -1) : removed);
        }
        if (layerError) {
            layer.handle_error(layerError, req, res, next);
        }
        else {
            layer.handle_request(req, res, next);
        }
        function processParams(layer, paramCalled, req, res, done) {
            const params = layer.params;
            const keys = layer.keys;
            if (!keys || keys.length === 0) {
                return done();
            }
            let i = 0;
            let name;
            let paramIndex = 0;
            let key;
            let paramValue;
            let paramCallback;
            function param(err) {
                if (err) {
                    return done(err);
                }
                if (i >= keys.length) {
                    return done();
                }
                paramIndex = 0;
                key = keys[i++];
                name = key.name;
                paramValue = req.params[name];
                paramCallback = params[paramIndex++];
                paramCalled = called[name];
                if (paramvalue === undefined || !paramCallback) {
                    return param();
                }
                if (paramCalled && (paramCalled.match === paramValue || (paramCalled.error && paramCalled.error !== 'route'))) {
                    req.params[name] = paramCalled.value;
                    return param(paramCalled.error);
                }
            }
            called[name] = paramCalled = {
                error: null,
                match: paramVal,
                value: paramVal
            };
            paramCallback();
        }
    }
    /**
     * @description 添加方法到列表
     * @param {Array} list 列表
     * @param {string[]} methods 方法
     */
    appendMethods(list, methods) {
        // list.push(method);
        methods.forEach((method, index) => {
            if (list.indexOf(method) === -1) {
                list.push(method);
            }
        });
    }
    /**
     * 发送OPTIONS 响应
     * @param {Response} res 响应对象
     * @param {any[]} options 路由配置
     * @param {NextFunction} done 回调函数
     */
    sendOptonsResponse(res, options, done) {
        try {
            // const body = JSON.stringify(options, null, 2);
            const body = options.join(',');
            res.set('Allow', body);
            res.send(body);
        }
        catch (error) {
            next(err);
        }
    }
    /**
     * @description merge Function params
     * @param {*} params 参数
     * @param {*} parent 父级参数
     * @returns
     */
    mergeParamsFn(params, parent) {
        /**
         * 如果 parent不是对象或者不存在，则返回params
         */
        if (typeof parent !== 'object' || !parent) {
            return params;
        }
        /**
         * 混入parent到obj
         */
        const obj = (0, index_1.mixin)({}, parent);
        if (!(0 in params) || !(0 in parent)) {
            return (0, index_1.mixin)(obj, params);
        }
        const paramsLen = params.length;
        const parentLen = parent.length;
        /**
         * 从后往前遍历
         * 对params进行扩容
         */
        for (let i = paramsLen; i >= 0; i--) {
            params[i + parentLen] = params[i];
            /**
             * 如果必要，创建空对象
             */
            if (paramsLen < parentLen) {
                /**
                 * 删除params[i]
                 */
                delete params[i];
            }
        }
        return (0, index_1.mixin)(obj, params);
    }
    /**
     * 获取协议和主机
     * @param {string} url 路径
     * @returns
     */
    getProtohost(url) {
        /**
         * 如果路径不合法就返回undefined
         */
        if (typeof url !== 'string' || url.length === 0 || url[0] !== '/') {
            return undefined;
        }
        /**
         * 解析一下query
         */
        const searchQuery = url.indexOf('?');
        /**
         * 设置pathLength
         */
        const pathLength = searchQuery !== -1 ? searchQuery : url.length;
        /**
         * 设置fqdnIndex 这是协议和主机开始的地方
         */
        const fqdnIndex = url.slice(0, pathLength).indexOf('://');
        /**
         * 如果 fbdnIndex 不等于 - 1, 则返回 url 的子字符串
         * 这里需要从3开始，因为://占3个字符
         * 返回协议和主机
         */
        return fqdnIndex !== -1
            ? url.substring(0, url.indexOf('/', 3 + fqdnIndex))
            : undefined;
    }
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
    restore(fn, obj, ...keys) {
        const props = keys;
        const vals = keys.map(key => obj[key]);
        return function (...args) {
            props.forEach((prop, index) => {
                obj[prop] = vals[index];
            });
            return fn.apply(this, args);
        };
    }
    /**
     * 包装中间件函数
     * @param {Function} old 原始函数，将要被包装的函数
     * @param {(any[]) => any} fn 包装函数，增强函数的功能
     * @returns
     */
    wrap(old, fn) {
        /**
         * 代理
         */
        return function () {
            const args = new Array(arguments.length + 1);
            /**
             * 初始化args[0]
             */
            args[0] = old;
            // 这里根据参数的数量去包装一个函数数组
            [...arguments].forEach((arg, index) => {
                args[index + 1] = arg;
            });
            /**
             * 执行包装后的函数
             */
            return fn.apply(this, args);
        };
    }
}
exports.default = Router;
