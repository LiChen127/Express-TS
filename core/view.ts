'use strict';
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
import fs from 'fs';
import path from 'path';
// import { View } from './type';
import { ViewOptions } from './type/index';
/**
 * 定义公用变量
 */
/** 获取当前文件夹路径 */
const dirname = path.dirname;
/** base var */
const basename = path.basename;
/** 获取文件扩展名 */
const extname = path.extname;
/** join方法 */
const join = path.join;
/** resolve 方法 */
const resolve = path.resolve;

/**
 * 定义View类
 */
export class View {
  private defaultEngine: string;
  private ext: string;
  private options: ViewOptions;
  private root: string[];
  private engine: Function;
  private path: string;
  private filename: string;

  constructor(name: string, options: ViewOptions) {
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
  private lookup(name: string): string {
    let path = '';
    const roots: string[] = ([] as string[]).concat(this.root);

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
  private render(options: any, callback: Function): any {
    this.engine(this.path, options, callback);
  }

  /**
   * 解析路径
   * @param dir 目录
   * @param file 文件
   * @returns 路径
   */
  private resolve(dir: string, file: string): string {
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
  private tryStat(path: string): fs.Stats | undefined {
    try {
      return fs.statSync(path);
    } catch (e) {
      return undefined;
    }
  }
}
