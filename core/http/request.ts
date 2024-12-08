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
import { TLSSocket } from 'tls';
import { Request, Response, Application } from '../type/index';

export class RequestHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  /**
   * 获取请求头
   */
  header(name: string): string | string[] | undefined {
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
  get protocol(): string {
    const proto = (this.req.socket as TLSSocket).encrypted ? 'https' : 'http';

    if (!this.app?.get('trust proxy fn')) {
      return proto;
    }

    const header = this.header('X-Forwarded-Proto') || proto;
    const index = header.indexOf(',');
    return index !== -1
      ? (header as string).substring(0, index).trim()
      : (header as string).trim();
  }

  /**
   * 获取IP地址
   */
  get ip(): string {
    return this.ips[0] || this.req.socket.remoteAddress || '';
  }

  /**
   * 获取所有IP地址
   */
  get ips(): string[] {
    const value = this.header('X-Forwarded-For');
    return value
      ? (value as string).split(',').map(ip => ip.trim())
      : [];
  }

  /**
   * 获取主机名
   */
  get hostname(): string {
    let host = this.header('X-Forwarded-Host') as string;
    if (!host || !this.app?.get('trust proxy')) {
      host = this.header('Host') as string;
    }

    if (!host) return '';

    const offset = host[0] === '[' ? host.indexOf(']') + 1 : 0;
    const index = host.indexOf(':', offset);
    return index !== -1
      ? host.substring(0, index)
      : host;
  }

  /**
   * 获取子域名
   */
  get subdomains(): string[] {
    const hostname = this.hostname;
    if (!hostname || isIP(hostname)) return [];

    const offset = this.app?.get('subdomain offset') || 2;
    return hostname.split('.').reverse().slice(offset);
  }

  /**
   * 检查内容是否新鲜
   */
  get fresh(): boolean {
    const method = this.req.method;
    const status = this.res.statusCode;

    if ('GET' !== method && 'HEAD' !== method) return false;
    if ((status >= 200 && status < 300) || 304 === status) {
      return fresh(this.req.headers, {
        'etag': this.res.getHeader('ETag'),
        'last-modified': this.res.getHeader('Last-Modified')
      });
    }
    return false;
  }

  /**
   * 获取请求参数
   */
  param(name: string, defaultValue?: any): any {
    const params = this.req.params || {};
    const body = this.req.body || {};
    const query = this.req.query || {};

    if (params[name] != null) return params[name];
    if (body[name] != null) return body[name];
    if (query[name] != null) return query[name];

    return defaultValue;
  }

  private get app(): Application | undefined {
    return this.req.app;
  }
}
