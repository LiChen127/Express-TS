"use strict";
/**
 * Express应用主类
 * 中间件系统
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
var events_1 = require("events");
var Application = /** @class */ (function (_super) {
    __extends(Application, _super);
    function Application() {
        var _this = _super.call(this) || this;
        // 中间件初始化
        _this.middleware = [];
        return _this;
    }
    /**
     * user方法
     * @param { Function } fn 中间件函数
     */
    Application.prototype.use = function (fn) {
        this.middleware.push(fn);
        return this;
    };
    /**
     * handleRequest方法
     * @param { IncomingMessage } req 请求对象
     * @param { ServerResponse } res 响应对象
     */
    Application.prototype.handleRequest = function (req, res, done) {
        var _this = this;
        // const middleware = this.middleware;
        /**
         * @todo 处理请求的核心逻辑
         */
        var index = 0;
        var next = function (err) {
            // 如果错误，跳过所有的非错误中间件 直接处理错误
            if (err) {
                return done(err);
            }
            if (index >= _this.middleware.length) {
                return done();
            }
            var handler = _this.middleware[index++];
            try {
                handler(req, res, next);
            }
            catch (err) {
                next(err);
            }
        };
        next();
    };
    /**
     * handle方法
     * @param { Request } req 请求对象
     * @param { Response } res 响应对象
     */
    Application.prototype.handle = function (req, res) {
        var request = req;
        var response = res;
        this.handleRequest(req, res, function (err) {
            if (err) {
                res.statusCode = 500;
                res.end("Internal Server Error: ".concat(err.message));
            }
            if (!res.writableEnded) {
                res.statusCode = 404;
                res.end('Not Found');
            }
        });
    };
    Application.prototype.listen = function (port, callback) {
        return require('http')
            .createServer(this.handle.bind(this))
            .listen(port, callback);
    };
    return Application;
}(events_1.EventEmitter));
exports.Application = Application;
