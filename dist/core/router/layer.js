'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 路由层
 */
const path_to_regexp_1 = __importDefault(require("path-to-regexp"));
const { hasOwnProperty } = Object.prototype;
class Layer {
    constructor(path, options, fn) {
        this.path = path;
        this.regexp = (0, path_to_regexp_1.default)(path, this.keys = [], options);
        this.name = fn.name || '<anonymous>';
        this.handle = fn;
        this.opts = options;
        this.regexp.fast_star = path === '*';
        this.regexp.fast_slash = path === '/';
        this.method = undefined;
    }
    handle_error(err, req, res, next) {
        const fn = this.handle;
        if (fn.length !== 4) {
            return next(err);
        }
        try {
            fn(err, req, res, next);
        }
        catch (error) {
            next(error);
        }
    }
    handle_request(req, res, next) {
        const fn = this.handle;
        if (fn.length !== 3) {
            return next();
        }
        try {
            fn(null, req, res, next);
        }
        catch (error) {
            next(error);
        }
    }
    match(path) {
        let match;
        if (path !== null) {
            if (this.regexp.fast_star) {
                this.params = {};
                this.path = '';
                return true;
            }
            if (this.regexp.fast_slash) {
                this.params = { '0': this.decode_param(path) };
                this.path = path;
                return true;
            }
            match = this.regexp.exec(path);
        }
        else {
            this.params = undefined;
            this.path = undefined;
            return false;
        }
        this.params = {};
        this.path = match[0];
        const keys = this.keys;
        const params = this.params;
        for (let i = 1; i < match.length; i++) {
            let key = keys[i - 1];
            let prop = key.name;
            let val = this.decode_param(match[i]);
            if (val !== undefined || !hasOwnProperty.call(params, prop)) {
                params[prop] = val;
            }
        }
        return true;
    }
    decode_param(val) {
        if (typeof val !== 'string' || val.length === 0) {
            return val;
        }
        try {
            return decodeURIComponent(val);
        }
        catch (error) {
            // return val;
            if (error instanceof URIError) {
                error.message = 'Failed to decode param \'' + val + '\'';
                // error.status = error.statusCode = 400;
            }
            throw error;
        }
    }
}
exports.default = Layer;
