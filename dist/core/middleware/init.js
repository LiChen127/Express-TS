'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 初始化中间件
 */
const setprototypeof_1 = __importDefault(require("setprototypeof"));
// export default function init(app: Application) {
// }
class Init {
    constructor(app) {
        this.app = app;
    }
    static expressInit(req, res, next) {
        if (this.app.enabled('x-powered-by')) {
            res.setHeader('X-Powered-By', 'Express');
        }
        req.res = res;
        res.req = req;
        req.next = next;
        (0, setprototypeof_1.default)(req, Request.prototype);
        (0, setprototypeof_1.default)(res, Response.prototype);
        res.locals = res.locals || Object.create(null);
        next();
    }
}
const ExpressInit = Init.expressInit;
exports.default = ExpressInit;
