'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.View = void 0;
/**
 * View
 * - 查找和加载视图文件
 * - 使用指定的渲染引擎渲染视图
 * - 处理路径解析和文件存在性检查
 * - 支持自定义的渲染引擎, 允许使用不同的模板格式
 */
/**
 * 引入依赖
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * 定义公用变量
 */
/** 获取当前文件夹路径 */
const dirname = path_1.default.dirname;
/** base var */
const basename = path_1.default.basename;
/** 获取文件扩展名 */
const extname = path_1.default.extname;
/** join方法 */
const join = path_1.default.join;
/** resolve 方法 */
const resolve = path_1.default.resolve;
/**
 * 定义View类
 */
class View {
    constructor(name, options) {
        this.options = options;
        this.root = options.root || [];
        this.defaultEngine = options.defaultEngine || '';
        this.ext = extname(name);
        this.filename = name;
        if (!this.ext || !this.defaultEngine) {
            throw new Error('View options require extensions and default engine');
        }
        /**
         * 如果视图文件没有扩展名，则使用默认的扩展名
         */
        if (!this.ext) {
            this.ext = this.defaultEngine[0] !== '.' ? '.' + this.defaultEngine : this.defaultEngine;
            this.filename = this.filename + this.ext;
        }
        /**
         * 如果没有引擎
         * @todo: 待完善
         */
        /** 存储加载引擎 */
        this.engine = this.options.engines[this.ext];
        /** 用路径查找视图，拼接视图文件 */
        this.path = this.lookup(this.filename);
    }
    /**
     * 查找视图文件路径
     * @param name 视图文件名
     * @returns 视图文件路径
     */
    lookup(name) {
        let path = '';
        const roots = [].concat(this.root);
        roots.forEach((root, index) => {
            const currentRoot = roots[index];
            /** 解析路径 */
            const loc = resolve(currentRoot, name);
            const dir = dirname(loc);
            const file = basename(loc);
            /** 拼接路径 */
            path = this.resolve(dir, file);
        });
        return path;
    }
    /**
     * 渲染视图
     * @param options 渲染选项
     * @param callback 回调函数
     * @returns 渲染结果
     */
    render(options, callback) {
        this.engine(this.path, options, callback);
    }
    /**
     * 解析路径
     * @param dir 目录
     * @param file 文件
     * @returns 路径
     */
    resolve(dir, file) {
        const ext = this.ext;
        let path = join(dir, file);
        let stat = this.tryStat(path);
        if (stat && stat.isFile()) {
            return path;
        }
        path = join(dir, basename(file, ext), ext);
        stat = this.tryStat(path);
        if (stat && stat.isFile()) {
            return path;
        }
        throw new Error('Failed to locate template file');
    }
    /**
     * 尝试获取文件状态
     * @param path 路径
     * @returns 文件状态
     */
    tryStat(path) {
        try {
            return fs_1.default.statSync(path);
        }
        catch (e) {
            return undefined;
        }
    }
}
exports.View = View;
