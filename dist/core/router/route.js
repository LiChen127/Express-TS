'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 路由
 */
const layer_1 = __importDefault(require("./layer"));
const constants_1 = require("../constants");
const slice = Array.prototype.slice;
const toString = Object.prototype.toString;
class Route {
    constructor(path) {
        this.stack = [];
        this.methods = {};
        this.path = path;
    }
    /**
     * 添加处理方法
     */
    _handles_method(method) {
        if (this.methods._all) {
            return true;
        }
        let name = typeof method === 'string' ? method.toLowerCase() : '';
        if (name === 'head' && !this.methods['head']) {
            name = 'get';
        }
        return Boolean(this.methods[name]);
    }
    options() {
        const methods = Object.keys(this.methods);
        0;
    }
    /**
     * 添加中间件
     */
    dispatch(req, res, done) {
        var _a;
        let idx = 0;
        const method = (_a = req.method) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const stack = this.stack;
        if (stack.length === 0) {
            return done();
        }
        if (!method) {
            return done(new Error('Method not found'));
        }
        const next = (err) => {
            if (err) {
                return done(err);
            }
            const layer = stack[idx++];
            if (!layer) {
                return done();
            }
            if (layer.method && layer.method !== method) {
                return next();
            }
            layer.handle(null, req, res, next);
        };
        next();
    }
    /**
     * 添加处理函数
     */
    handle(method, handlers) {
        const lowerMethod = method.toLowerCase();
        this.methods[lowerMethod] = true;
        for (let handler of handlers) {
            const layer = new layer_1.default('/', {
                method: lowerMethod
            }, handler);
            this.stack.push(layer);
        }
        return this;
    }
    /**
     * 支持的 HTTP 方法
     */
    all(handlers) {
        for (let method of constants_1.Methods) {
            this.handle(method, handlers);
        }
        return this;
    }
}
exports.default = Route;
