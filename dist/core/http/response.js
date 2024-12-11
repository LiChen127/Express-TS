"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
const path_1 = require("path");
const querystring_1 = require("querystring");
const cookie_signature_1 = require("cookie-signature");
const buffer_1 = require("buffer");
const mime_1 = __importDefault(require("mime"));
const vary_1 = __importDefault(require("vary"));
const statuses_1 = __importDefault(require("statuses"));
const index_1 = require("../utils/index");
const content_disposition_1 = require("content-disposition");
const utils_merge_1 = __importDefault(require("utils-merge"));
const escape_html_1 = __importDefault(require("escape-html"));
const send_1 = require("send");
const process_1 = require("process");
const on_finished_1 = __importDefault(require("on-finished"));
const charsetRegExp = /;\s*charset\s*=/;
class ResponseHandler {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.locals = {};
    }
    /**
     * 获取响应头
     */
    header(field, val) {
        if (arguments.length === 2) {
            let value = Array.isArray(val) ? val.map(String) : String(val);
            if (field.toLowerCase() === 'content-type') {
                if (Array.isArray(value)) {
                    throw new Error('Content-Type cannot be set to an array');
                }
                if (!charsetRegExp.test(value)) {
                    const charset = mime_1.default.charset(value);
                    if (charset) {
                        value += '; charset=' + charset.toLowerCase();
                    }
                }
            }
            this.res.setHeader(field, value);
        }
        else {
            this.res.setHeader(field, field);
        }
        return this.res.getHeader(field);
    }
    /**
     * 设置响应头
     */
    set(field, val) {
        if (typeof field === 'string') {
            const value = Array.isArray(val) ? val.map(String) : String(val);
            this.res.setHeader(field, value);
        }
        else {
            for (const key in field) {
                this.set(key, field[key]);
            }
        }
        return this;
    }
    /**
     * 获取状态码
     */
    status(code) {
        if (typeof code === 'number' && Math.floor(code) === code && code > 99 && code < 1000) {
            throw new Error('Invalid status code');
        }
        this.res.statusCode = code;
        return this;
    }
    link(links) {
        let link = this.req.get('Link') || '';
        if (link) {
            link += ', ';
        }
        // 将links对象转换为Link头字符串
        return this.set('Link', link + Object.keys(links).map((rel) => {
            return `<${links[rel]}>; rel="${rel}"`;
        }).join(', '));
    }
    /**
     * 设置Content-Type
     */
    contentType(type) {
        const ct = type.indexOf('/') === -1
            ? mime_1.default.getType(type)
            : type;
        return this.set('Content-Type', ct);
    }
    /**
     * 发送响应
     */
    send(body) {
        var _a;
        let chunk = body;
        // const encoding = this.res.getHeader('Content-Encoding');
        let encoding = '';
        const req = this.req;
        let type;
        const app = this.app;
        if (arguments.length === 2) {
            if (typeof arguments[0] !== 'number' && typeof arguments[1] !== 'number') {
                this.status(arguments[1]);
                throw new Error('Invalid arguments');
            }
            else {
                this.status(arguments[0]);
                chunk = arguments[1];
            }
        }
        if (typeof chunk === 'number' && arguments.length === 1) {
            if (!this.res.getHeader('Content-Type')) {
                // this.contentType('html');
                this.contentType('txt');
            }
            this.status(chunk);
            /**
             * 获取状态码对应的消息
             */
            chunk = statuses_1.default.message[chunk];
        }
        switch (typeof chunk) {
            case 'string':
                if (!this.header('Content-Type')) {
                    this.contentType('html');
                }
                break;
            case 'boolean':
            case 'number':
            case 'object':
                if (chunk === null) {
                    chunk = '';
                }
                else if (buffer_1.Buffer.isBuffer(chunk)) {
                    if (!this.header('Content-Type')) {
                        this.contentType('bin');
                    }
                }
                else {
                    return this.json(chunk);
                }
                break;
        }
        if (typeof chunk === 'string') {
            encoding = 'utf8';
            type = this.header('Content-Type');
            if (typeof type === 'string') {
                this.set('Content-Type', (0, index_1.setCharset)(type, 'utf8'));
            }
        }
        /**
         * 确定是否生成Etag
         */
        const etagFn = (_a = this.app) === null || _a === void 0 ? void 0 : _a.get('etag fn');
        const generateETag = !this.header('ETag') && etagFn === 'function';
        let len;
        if (chunk !== undefined) {
            if (buffer_1.Buffer.isBuffer(chunk)) {
                // 如果chunk是Buffer，则直接使用其长度
                len = chunk.length;
            }
            else if (!generateETag && chunk.length < 1000) {
                // 如果chunk不是Buffer，并且长度小于1000，则使用字符串长度
                len = buffer_1.Buffer.byteLength(chunk);
            }
            else {
                // 否则， 将chunk转换为Buffer对象长度，并计算长度
                // chunk = Buffer.from(chunk, encoding);
                // encoding = undefined;
                // len = chunk.length;
                chunk = buffer_1.Buffer.from(chunk, encoding);
                encoding = null;
                len = chunk.length;
            }
            this.set('Content-Length', len);
        }
        /**
         * 如果 generateETag 为 true，且 len 不为 undefined
         */
        let etag;
        if (generateETag && len !== undefined) {
            etag = etagFn(chunk, len);
            this.set('ETag', etag);
        }
        if (this.req.fresh) {
            this.status(304);
        }
        if (this.req.statusCode === 204 || this.req.statusCode === 304) {
            this.res.removeHeader('Content-Type');
            this.res.removeHeader('Content-Length');
            this.res.removeHeader('Transfer-Encoding');
            chunk = '';
        }
        if (this.req.statusCode === 205) {
            this.set('Content-Length', 0);
            this.res.removeHeader('Transfer-Encoding');
            chunk = '';
        }
        if (req.method === 'HEAD') {
            this.end();
        }
        else {
            this.end(chunk, encoding);
        }
        return this;
    }
    /**
     * 发送JSON响应
     */
    json(obj) {
        // const body = JSON.stringify(obj);
        // if (!this.header('Content-Type')) {
        //   this.contentType('application/json');
        // }
        let val = obj;
        // return this.send(body);
        if (typeof arguments[1] === 'number') {
            this.status(arguments[1]);
        }
        else {
            this.status(arguments[0]);
            val = arguments[1];
        }
        const app = this.app;
        const escape = app === null || app === void 0 ? void 0 : app.get('json escape');
        const replacer = app === null || app === void 0 ? void 0 : app.get('json replacer');
        const spaces = app === null || app === void 0 ? void 0 : app.get('json spaces');
        const body = (0, querystring_1.stringify)(val, replacer, spaces, escape);
        if (!this.header('Content-Type')) {
            this.contentType('application/json');
        }
        return this.send(body);
    }
    /**
     * 发送JSONP响应
     */
    jsonp(obj) {
        let val = obj;
        if (arguments.length === 2) {
            if (typeof arguments[1] === 'number') {
                this.status(arguments[1]);
            }
            else {
                this.status(arguments[0]);
                val = arguments[1];
            }
        }
        const app = this.app;
        const escape = app === null || app === void 0 ? void 0 : app.get('json escape');
        const replacer = app === null || app === void 0 ? void 0 : app.get('json replacer');
        const spaces = app === null || app === void 0 ? void 0 : app.get('json spaces');
        let body = (0, querystring_1.stringify)(val, replacer, spaces, escape);
        let callback = this.req.query[app === null || app === void 0 ? void 0 : app.get('jsonp callback name')];
        if (!this.header('Content-Type')) {
            this.set('X-Content-Type-Options', 'nosniff');
            this.set('Content-Type', 'application/json');
        }
        if (Array.isArray(callback)) {
            callback = callback[0];
        }
        if (typeof callback === 'string' && callback.length) {
            this.set('X-Content-Type-Options', 'nosniff');
            this.set('Content-Type', 'application/javascript');
            /**
             * 移除非法字符
             */
            callback = callback.replace(/[^\[\]\w$.]/g, '');
            if (body === undefined) {
                body = '';
            }
            else if (typeof body === 'string') {
                /**
                 * 替换Unicode转义字符 不允许在JavaScript中使用
                 */
                body = body.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
            }
            body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';
        }
        return this.send(body);
    }
    /**
     * 传输给定 path 的文件
     */
    sendFile(path, options = {}, callback) {
        let cb = callback;
        const req = this.req;
        const res = this.res;
        const next = this.req.next;
        let opts = Object.assign({}, options);
        if (!path) {
            throw new Error('path is required');
        }
        if (typeof path !== 'string') {
            throw new Error('path must be a string');
        }
        if (!opts.root && !(0, path_1.isAbsolute)(path)) {
            throw new Error('path must be an absolute path');
        }
        const pathname = encodeURI(path);
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        const file = (0, send_1.send)(req, pathname, opts);
    }
    /**
     * download
     * @param {string} path 文件路径
     * @param {string} filename 文件名
     * @param {Record<string, any>} options 选项
     * @param {Function} callback 回调函数
     * @returns {this}
     */
    download(path, filename, options = {}, callback) {
        let cb = callback;
        const req = this.req;
        const res = this.res;
        const next = this.req.next;
        let opts = Object.assign({}, options);
        let name = filename;
        if (typeof name === 'function') {
            cb = name;
            opts = {};
            name = null;
        }
        if (typeof filename === 'object' && (typeof options === 'function' || options === undefined)) {
            opts = filename;
            name = null;
        }
        const headers = {
            'Content-Disposition': (0, content_disposition_1.contentDisposition)((name || path).toString()),
        };
        if (opts && opts.headers) {
            const keys = Object.keys(opts.headers);
            keys.forEach((key, index) => {
                if (key.toLowerCase() !== 'content-disposition') {
                    this.set(key, opts.headers[index]);
                }
            });
        }
        opts = Object.create(opts);
        opts.headers = headers;
        return this.sendFile(path, opts, cb);
    }
    /**
     * 管道发送文件流
     * @param res
     * @param file
     * @param options
     * @param callback
     */
    sendfile(res, file, options, callback) {
        let done = false;
        let streaming;
        // function onaborted() {
        // }
        const onaborted = () => {
            if (done) {
                return;
            }
            done = true;
            const err = new Error('Request aborted');
            err.code = 'ECONNABORTED';
            callback(err);
        };
        const ondirectory = () => {
            if (done) {
                return;
            }
            done = true;
            const err = new Error('Request aborted');
            err.code = 'EISDIR';
            callback(err);
        };
        const onend = () => {
            if (done) {
                return;
            }
            done = true;
            callback();
        };
        const onerror = (err) => {
            if (done) {
                return;
            }
            done = true;
            callback(err);
        };
        const onfile = () => {
            streaming = false;
        };
        const onfinish = (err) => {
            if (err && err.code === 'ECONNRESET')
                return onaborted();
            if (err)
                return onerror(err);
            if (done)
                return;
            // onend();
            (0, process_1.nextTick)(() => {
                if (streaming && !done) {
                    onaborted();
                    return;
                }
                if (done) {
                    return;
                }
                done = true;
                callback();
            });
        };
        const onstream = () => {
            streaming = true;
        };
        file.on('directory', ondirectory);
        file.on('end', onend);
        file.on('error', onerror);
        file.on('file', onfile);
        file.on('finish', onfinish);
        file.on('stream', onstream);
        (0, on_finished_1.default)(res, onfinish);
        if (options.headers) {
            const keys = Object.keys(options.headers);
            keys.forEach((key) => {
                this.set(key, options.headers[key]);
            });
        }
        // 管道
        file.pipe(res);
    }
    /**
     * format
     * @param {*} obj
     */
    format(obj) {
        const req = this.req;
        const next = req.next;
        const keys = Object.keys(obj).filter((x) => x !== 'default');
        const key = keys.length > 0 ? req.accepts(keys) : false;
        this.vary('Accept');
        if (key) {
            this.set('Content-Type', (0, index_1.normalizeContentType)(key).value);
            obj[key](req, this, next);
        }
        else if (obj.default) {
            // next(createeRR)
            throw new Error('406');
        }
        return this;
    }
    /**
     * attachment
     */
    attachment(filename) {
        if (filename) {
            this.contentType((0, path_1.extname)(filename));
        }
        this.set('Conent-Disposition', (0, content_disposition_1.contentDisposition)(filename));
        return this;
    }
    /**
     * 重定向
     */
    redirect(url, status = 302) {
        // 设置位置头
        let address = url;
        let path = '';
        let body;
        if (arguments.length === 2) {
            if (typeof arguments[0] === 'number') {
                this.status(arguments[0]);
                address = arguments[1];
            }
            else {
                this.status(status);
            }
        }
        address = this.location(address).get('Location').toString();
        this.format({
            text: () => {
                body = statuses_1.default.message[status] + '. Redirecting to ' + address;
            },
            html: () => {
                const u = (0, escape_html_1.default)(address);
                body = '<p>' + statuses_1.default.message[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
            },
            default: () => {
                body = '';
            }
        });
        this.status(status);
        this.set('Content-Length', buffer_1.Buffer.byteLength.toString());
        if (this.req.method === 'HEAD') {
            this.end();
        }
        else {
            this.end(body);
        }
    }
    /**
     * 设置Cookie
     */
    cookie(name, value, options = {}) {
        var _a;
        const secret = (_a = this.app) === null || _a === void 0 ? void 0 : _a.get('cookie secret');
        const signed = options.signed;
        const opts = (0, utils_merge_1.default)({}, options);
        if (signed && !secret) {
            throw new Error('cookieParser("secret") required for signed cookies');
        }
        let val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);
        if (signed) {
            val = 's:' + (0, cookie_signature_1.sign)(val, secret);
        }
        if (opts.maxAge !== null) {
            let maxAge = opts.maxAge - 0;
            if (!isNaN(maxAge)) {
                opts.expires = new Date(Date.now() + maxAge);
                opts.maxAge = Math.floor(maxAge / 1000);
            }
        }
        if (opts.path == null) {
            opts.path = '/';
        }
        this.append('Set-Cookie', this.serializeCookie(name, val, opts));
        return this;
    }
    /**
     * location
     */
    location(url) {
        let loc;
        if (url === 'back') {
            loc = this.req.get('Referrer') || '/';
        }
        else {
            loc = url;
        }
        return this.set('Location', encodeURI(String(loc)));
    }
    /**
     * 添加Vary头
     */
    vary(field) {
        if (!field || (Array.isArray(field) && !field.length)) {
            return this;
        }
        (0, vary_1.default)(this.res, field);
        return this;
    }
    /**
     * 追加额外的响应头
     */
    append(field, val) {
        const prev = this.header(field);
        let value = val;
        if (prev) {
            value = (Array.isArray(prev) ? prev.concat(value) : Array.isArray(value) ? [prev].concat(value) : [prev, value]);
        }
        return this.set(field, value);
    }
    /**
     * 结束响应
     */
    end(data, encoding) {
        this.res.end(data);
    }
    /**
     * clearCookie
     */
    clearCookie(name, options) {
        if (options) {
            if (options.maxAge) {
                console.log('res.clearCookie "options.maxAge"');
            }
            if (options.expires) {
                console.log('res.clearCookie "options.expires"');
            }
        }
        const opts = (0, utils_merge_1.default)({ expires: new Date(1), path: '/' }, options);
        return this.cookie(name, '', opts);
    }
    /**
     * 序列化Cookie
     */
    serializeCookie(name, val, options) {
        const pairs = [`${name}=${encodeURIComponent(val)}`];
        if (options.maxAge)
            pairs.push(`Max-Age=${options.maxAge}`);
        if (options.domain)
            pairs.push(`Domain=${options.domain}`);
        if (options.path)
            pairs.push(`Path=${options.path}`);
        if (options.expires)
            pairs.push(`Expires=${options.expires.toUTCString()}`);
        if (options.httpOnly)
            pairs.push('HttpOnly');
        if (options.secure)
            pairs.push('Secure');
        if (options.sameSite)
            pairs.push(`SameSite=${options.sameSite}`);
        return pairs.join('; ');
    }
    render(view, options, callback) {
        const app = this.app;
        let cb = callback || Function;
        let opts = options || {};
        const req = this.req;
        const self = this;
        if (typeof options === 'function') {
            cb = options;
            opts = {};
        }
        opts._locals = self.locals;
        app === null || app === void 0 ? void 0 : app.render(view, opts, cb);
    }
    /**
     * stringify
     */
    stringify(obj, replacer, spaces, escape) {
        let json = replacer || spaces ? JSON.stringify(obj, replacer, spaces) : JSON.stringify(obj);
        if (escape && typeof json === 'string') {
            json = json.replace(/[<>&]/g, function (c) {
                switch (c.charCodeAt(0)) {
                    case 0x3c:
                        return '\\u003c';
                    case 0x3e:
                        return '\\u003e';
                    case 0x26:
                        return '\\u0026';
                    default:
                        return c;
                }
            });
            return json;
        }
    }
    get app() {
        return this.res.app;
    }
    get(field) {
        return this.res.getHeader(field);
    }
}
exports.ResponseHandler = ResponseHandler;
