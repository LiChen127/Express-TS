'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestHandler = void 0;
const net_1 = require("net");
const fresh_1 = __importDefault(require("fresh"));
class RequestHandler {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }
    /**
     * 获取请求头
     */
    header(name) {
        const lc = name.toLowerCase();
        switch (lc) {
            case 'referer':
            case 'referrer':
                return this.req.headers.referer || this.req.headers.referrer;
            default:
                return this.req.headers[lc];
        }
    }
    /**
     * 获取协议
     */
    get protocol() {
        var _a;
        const proto = this.req.socket.encrypted ? 'https' : 'http';
        if (!((_a = this.app) === null || _a === void 0 ? void 0 : _a.get('trust proxy fn'))) {
            return proto;
        }
        const header = this.header('X-Forwarded-Proto') || proto;
        const index = header.indexOf(',');
        return index !== -1
            ? header.substring(0, index).trim()
            : header.trim();
    }
    /**
     * 获取IP地址
     */
    get ip() {
        return this.ips[0] || this.req.socket.remoteAddress || '';
    }
    /**
     * 获取所有IP地址
     */
    get ips() {
        const value = this.header('X-Forwarded-For');
        return value
            ? value.split(',').map(ip => ip.trim())
            : [];
    }
    /**
     * 获取主机名
     */
    get hostname() {
        var _a;
        let host = this.header('X-Forwarded-Host');
        if (!host || !((_a = this.app) === null || _a === void 0 ? void 0 : _a.get('trust proxy'))) {
            host = this.header('Host');
        }
        if (!host)
            return '';
        const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0;
        const index = host.indexOf(':', offset);
        return index !== -1
            ? host.substring(0, index)
            : host;
    }
    /**
     * 获取子域名
     */
    get subdomains() {
        var _a;
        const hostname = this.hostname;
        if (!hostname || (0, net_1.isIP)(hostname))
            return [];
        const offset = ((_a = this.app) === null || _a === void 0 ? void 0 : _a.get('subdomain offset')) || 2;
        return hostname.split('.').reverse().slice(offset);
    }
    /**
     * 检查内容是否新鲜
     */
    get fresh() {
        const method = this.req.method;
        const status = this.res.statusCode;
        if ('GET' !== method && 'HEAD' !== method)
            return false;
        if ((status >= 200 && status < 300) || 304 === status) {
            return (0, fresh_1.default)(this.req.headers, {
                'etag': this.res.getHeader('ETag'),
                'last-modified': this.res.getHeader('Last-Modified')
            });
        }
        return false;
    }
    /**
     * 获取请求参数
     */
    param(name, defaultValue) {
        const params = this.req.params || {};
        const body = this.req.body || {};
        const query = this.req.query || {};
        if (params[name] != null)
            return params[name];
        if (body[name] != null)
            return body[name];
        if (query[name] != null)
            return query[name];
        return defaultValue;
    }
    get app() {
        return this.req.app;
    }
}
exports.RequestHandler = RequestHandler;
