'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * query 中间件
 */
const utils_merge_1 = __importDefault(require("utils-merge"));
const parseurl_1 = __importDefault(require("parseurl"));
const qs_1 = __importDefault(require("qs"));
function query(options) {
    let opts = (0, utils_merge_1.default)({}, options);
    let queryparse = qs_1.default.parse;
    if (typeof options === 'function') {
        queryparse = options;
        opts = undefined;
    }
    if (opts !== undefined && opts.allowPrototypes === undefined) {
        opts.allowPrototypes = true;
    }
    return function query(req, res, next) {
        if (!req.query) {
            const val = (0, parseurl_1.default)(req).query;
            req.query = queryparse(val, opts);
        }
        next();
    };
}
exports.default = query;
