'use strict';
/**
 * 路由层
 */

import pathToRegexp, { Key } from 'path-to-regexp';
import { NextFunction, Request, Response, RequestHandler } from '../type';
const { hasOwnProperty } = Object.prototype;

export default class Layer {
  private path: string | undefined;
  private regexp: any;
  private name: string;
  public handle: RequestHandler;
  private keys: Key[];
  private opts: any;
  private params: any;
  public method: string | undefined;

  constructor(path: string, options: any, fn: RequestHandler) {
    this.path = path;
    this.regexp = pathToRegexp(path, this.keys = [], options);
    this.name = fn.name || '<anonymous>';
    this.handle = fn;
    this.opts = options;
    this.regexp.fast_star = path === '*';
    this.regexp.fast_slash = path === '/';
    this.method = undefined;
  }

  public handle_error(err: any, req: Request, res: Response, next: NextFunction) {
    const fn = this.handle;
    if (fn.length !== 4) {
      return next(err);
    }

    try {
      fn(err, req, res, next);
    } catch (error) {
      next(error);
    }
  }

  public handle_request(req: Request, res: Response, next: NextFunction) {
    const fn = this.handle;
    if (fn.length !== 3) {
      return next();
    }

    try {
      fn(null, req, res, next);
    } catch (error) {
      next(error);
    }
  }

  private match(path: string) {
    let match: string;
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
    } else {
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

  private decode_param(val: string) {
    if (typeof val !== 'string' || val.length === 0) {
      return val;
    }

    try {
      return decodeURIComponent(val);
    } catch (error) {
      // return val;
      if (error instanceof URIError) {
        error.message = 'Failed to decode param \'' + val + '\'';
        // error.status = error.statusCode = 400;
      }
      throw error;
    }
  }
}