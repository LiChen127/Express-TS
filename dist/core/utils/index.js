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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileQueryParser = exports.compileETag = exports.setCharset = exports.flattenArray = exports.normalizeContentType = exports.compileTrust = exports.wetag = exports.createEtag = exports.mixin = void 0;
/**
 * Utility class for object operations
 * Provide static methods for object
 */
/**
 * 模块依赖
 */
const safe_buffer_1 = require("safe-buffer");
const contentType = __importStar(require("content-type"));
const array_flatten_1 = require("array-flatten");
const etag_1 = __importDefault(require("etag"));
const qs_1 = __importDefault(require("qs"));
const querystring_1 = __importDefault(require("querystring"));
const proxy_addr_1 = __importDefault(require("proxy-addr"));
const mime_1 = __importDefault(require("mime"));
class Utils {
    /**
     * Mixin property descriptors from the source object into the destination object
     * @param destination - Destination object
     * @param source - Source object
     * @param overwrite - Overwrite flag
     * @returns Mixed object
     * @throws TypeError if destination or source is not provided
     */
    static mixin(destination, source, overwrite = true) {
        if (!destination) {
            throw new TypeError('The `destination` argument is required.');
        }
        if (!source) {
            throw new TypeError('The `source` argument is required.');
        }
        /**
         * Mixin property descriptors from the source object into the destination object
         */
        for (const name of Object.getOwnPropertyNames(source)) {
            if (!overwrite && Object.prototype.hasOwnProperty.call(destination, name)) {
                continue;
            }
            const descriptor = Object.getOwnPropertyDescriptor(source, name);
            Object.defineProperty(destination, name, descriptor);
        }
        /**
         * Mixin property descriptors from the source object into the destination object
         */
        for (const symbol of Object.getOwnPropertySymbols(source)) {
            if (!overwrite && Object.prototype.hasOwnProperty.call(destination, symbol)) {
                continue;
            }
            const descriptor = Object.getOwnPropertyDescriptor(source, symbol);
            Object.defineProperty(destination, symbol, descriptor);
        }
        return destination;
    }
    /**
     * Generate etag for `body`
     * @param {String|Buffer} body
     * @param {String} [encoding]
     * @return {String}
     */
    static createEtag(body, encoding) {
        const buffer = !safe_buffer_1.Buffer.isBuffer(body) ? safe_buffer_1.Buffer.from(body, encoding) : body;
        return (0, etag_1.default)(buffer, { weak: false }); // strong ETag
    }
    /**
     * Generate weak etag for `body`
     * @param {String|Buffer} body
     * @param {String} [encoding]
     * @return {String}
     */
    static createWeakEtag(body, encoding) {
        const buffer = !safe_buffer_1.Buffer.isBuffer(body) ? safe_buffer_1.Buffer.from(body, encoding) : body;
        return (0, etag_1.default)(buffer, { weak: true }); // weak ETag
    }
    /**
     * Normalze a content type (e.g., 'html -> text/html')
     * @param {String} type
     * @return {Object}
     */
    static normalizeContentType(type) {
        return ~type.indexOf('/')
            ? Utils.acceptParams(type)
            : { value: mime_1.default.getType(type) || 'application/octet-stream', params: {} };
    }
    /**
     * Flatten an array
     * @param {Array} array
     * @return {Array}
     */
    static flattenArray(array) {
        return (0, array_flatten_1.flatten)(array);
    }
    /**
     * Parse an accept parameter string and return an object with '.value', '.quality',  and '.params' properties
     * @param {String} str
     * @return {Object}
     */
    static acceptParams(str) {
        const parts = str.split(/ *; */);
        const result = { value: parts[0], quality: 1, params: {} };
        parts.forEach(part => {
            const pms = part.split(/ *= */);
            if ('q' === pms[0]) {
                result.quality = parseFloat(pms[1]);
            }
            else {
                result.params[pms[0]] = pms[1];
            }
        });
        return result;
    }
    /**
     * Generate a Content-Dispostion header for the filename
     * @param {String} filename
     * @return {String}
     */
    // static contentDisposition(filename: string): string {
    //   return contentDisposition(filename);
    // }
    /**
     * Set charset in a content-type string
     * @param {String} type
     * @param {String} charset
     * @return {String}
     */
    static setCharset(type, charset) {
        if (!type || !charset) {
            return type;
        }
        const parsed = contentType.parse(type);
        parsed.parameters.charset = charset;
        return contentType.format(parsed.type);
    }
    /**
     * Compile ETag generator based on provided configuration
     * @param {Boolean|String|Function} val
     * @return {Function}
     */
    static compileETag(val) {
        if (typeof val === 'function') {
            return val;
        }
        switch (val) {
            case true:
            case 'weak':
                return Utils.createWeakEtag;
            case false:
                return undefined;
            case 'strong':
                return Utils.createEtag;
            default:
                throw new Error('Invalid ETag mode');
        }
    }
    /**
     * Compile query parser function based on provided configuration
     * @param {String|Function} val
     * @return {Function}
     */
    static compileQueryParser(val) {
        switch (val) {
            case true:
            case 'simple':
                return querystring_1.default.parse;
            case false:
                return () => { };
            case 'extended':
                return qs_1.default.parse;
            default:
                throw new Error('Invalid query parser');
        }
    }
    /**
     * Compile proxy trust function based on provided configuration
     * @param {Boolean|String|Number|Array|Function} val
     * @return {Function}
     */
    static compileTrust(val) {
        if (typeof val === 'function') {
            return val;
        }
        if (val) {
            return () => true;
        }
        if (typeof val === 'string') {
            val = val.split(',').map(ip => ip.trim());
        }
        return proxy_addr_1.default.compile(val || []);
    }
}
const mixin = Utils.mixin;
exports.mixin = mixin;
const createEtag = Utils.createEtag;
exports.createEtag = createEtag;
const wetag = Utils.createWeakEtag;
exports.wetag = wetag;
const compileTrust = Utils.compileTrust;
exports.compileTrust = compileTrust;
const normalizeContentType = Utils.normalizeContentType;
exports.normalizeContentType = normalizeContentType;
const flattenArray = Utils.flattenArray;
exports.flattenArray = flattenArray;
// const contentDisposition = Utils.contentDisposition;
const setCharset = Utils.setCharset;
exports.setCharset = setCharset;
const compileETag = Utils.compileETag;
exports.compileETag = compileETag;
const compileQueryParser = Utils.compileQueryParser;
exports.compileQueryParser = compileQueryParser;
