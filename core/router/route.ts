'use strict';
/**
 * 路由
 */
import Layer from './layer';
import flatten from 'array-flatten';
import { Request, Response, NextFunction, RequestHandler } from '../type/index';
import { Methods } from '../constants';

const slice = Array.prototype.slice;
const toString = Object.prototype.toString;
export default class Route {
  private path: string;
  private stack: Layer[] = [];
  private methods: Record<string, boolean> = {};

  constructor(path: string) {
    this.path = path;
  }

  /**
   * 添加处理方法
   */
  public _handles_method(method: string): boolean {
    const name = method.toLowerCase();
    return Boolean(this.methods[name]);
  }

  /**
   * 添加中间件
   */
  public dispatch(req: Request, res: Response, done: NextFunction) {
    let idx = 0;
    const method = req.method?.toLowerCase();
    const stack = this.stack;

    if (stack.length === 0) {
      return done();
    }

    if (!method) {
      return done(new Error('Method not found'));
    }

    const next = (err?: Error) => {
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
  public handle(method: string, handlers: RequestHandler[]) {
    const lowerMethod = method.toLowerCase();
    this.methods[lowerMethod] = true;

    for (let handler of handlers) {
      const layer = new Layer('/', {
        method: lowerMethod
      }, handler);
      this.stack.push(layer);
    }

    return this;
  }

  /**
   * 支持的 HTTP 方法
   */
  public all(handlers: RequestHandler[]) {
    for (let method of Methods) {
      this.handle(method, handlers);
    }
    return this;
  }
}