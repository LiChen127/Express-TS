'use strict';
/**
 * Request 类
 */

import { IncomingMessage } from 'http';
import accepts from 'accepts';
import { isIP } from 'net';
import typeis from 'type-is';
import fresh from 'fresh';
import parseRange from 'range-parser';
import parse from 'parseurl';
import proxyaddr from 'proxy-addr';
import { Request, Response } from '../type/index';

export class RequestHandler {
  req: Request;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: Record<string, string>;
  query: Record<string, string>;
  res: Response;
  constructor(req: Request) {
    this.req = req;
    this.headers = req.headers as Record<string, string>;
    this.params = {};
    this.body = {};
    this.query = {};
    this.res = {};
  }
  /**
   * 获取请求头
   * @param name 
   * @returns 
   */
  header(name: string): string | undefined | string[] {
    if (!name) {
      throw new Error('name is required');
    }

    if (typeof name !== 'string') {
      throw new Error('name must be a string');
    }

    const lc = name.toLowerCase();

    switch (lc) {
      case 'referer':
      case 'referrer':
        return this.req.headers.referer || this.req.headers.referrer;
      default:
        return this.headers[lc];
    }
  }

  accepts(...types: string[]) {
    const accept = accepts(this.req);
    return accept.types(...types);
  }

  /**
   * 返回接收给定的编码形式
   */
  acceptsEncoding(...encodings: string[]) {
    const accept = accepts(this.req);
    return accept.encodings(...encodings);
  }

  /**
   * 返回接受给定的字符集
   */
  acceptsCharset(...charsets: string[]) {
    const accept = accepts(this.req);
    return accept.charsets(...charsets);
  }

  /**
   * 返回接受给定的语言
   */
  acceptsLanguage(...langs: string[]) {
    const accept = accepts(this.req);
    return accept.languages(...langs);
  }

  /**
   * 解析范围头
   * @param {number} size 大小
   * @param {object} [options] 选项
   * @param {boolean} [options.combine=false] 是否合并
   * @returns {number|Array} 返回范围数组或数字
   * @public
   */
  range(size: number, options?: { combine: boolean }): number | Array<[number, number]> | null {
    const range = this.header('range');
    if (!range) {
      return null;
    }
    return parseRange(size, range, options);
  }
  /**
   * 获取请求参数
   * @param {String} name 键
   * @param {Mixed} [defaultValue]
   * @return {String}
   * @public
   */
  param(name: string, defaultValue?: any): any {
    const params = this.params;
    const body = this.body;
    const query = this.query;

    if (params[name] && params.hasOwnProperty(name)) {
      return params[name];
    }

    if (body[name] && body.hasOwnProperty(name)) {
      return body[name];
    }

    if (query[name]) {
      return query[name];
    }

    return defaultValue;
  }

  /**
   * 检查请求是否接受给定的类型
   * @param {String|Array} types...
   * @return {String|false|null}
   * @public
   */
  is(types: string | string[]) {
    const arr = Array.isArray(types) ? types : [...arguments];
    return typeis(this.req, arr);
  }
  /**
   * 获取协议字符串 'http' 或 'https'
   */
  get protocol(): string {
    const proto = this.req.connection?.encrypted ? 'https' : 'http';
    const trust = this.req.app.get('trust proxy fn');
    if (!trust || !trust(this.req.connection?.remoteAddress, 0)) {
      return proto;
    }

    const header = this.req.headers['x-Forwarded-Proto'] || proto;
    let index = header.indexOf(',');
    return index !== -1 ? (header as string).substring(0, index).trim() : (header as string).trim();
  }
  /**
   * 判断是否为安全连接(https)
   */
  get secure(): boolean {
    return this.protocol === 'https';
  }
  /**
   * 获取请求的IP地址
   */
  get ip(): string {
    // return this.req.connection?.remoteAddress || '';
    const trust = this.req.app.get('trust proxy fn');
    return proxyaddr(this.req, trust);
  }
  /**
   * 获取请求的子域名
   */
  get subdomains(): string[] {
    const hostname = this.req.hostname;
    if (!hostname) {
      return [];
    }
    const offset = this.req.app?.get('subdomain offset') || 2;
    return hostname.split('.').reverse().slice(offset);
  }
  /**
   * 检查请求是否为新鲜请求
   */
  get fresh(): boolean {
    const method = this.req.method;
    const res = this.res;
    const status = res.statusCode;

    if (method !== 'GET' && method !== 'HEAD') {
      return false;
    }

    // return fresh(this.req.headers, { status, 'content-type': res.get('content-type') });

    if ((status >= 200 && status < 300) || status === 304) {
      return fresh(this.headers, {
        'etag': res.get('ETag'),
        'last-modified': res.get('Last-Modified')
      })
    }
    return false;
  }

  /**
   * 检查请求是否过时
   */
  get stale(): boolean {
    return !this.fresh;
  }
  /**
   * xhr
   */
  xhr(): boolean {
    return this.header('x-requested-with') === 'XMLHttpRequest';
  }
}
