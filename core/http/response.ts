import { ServerResponse } from 'http';
import { Request, Response, Application } from '../type/index';
import { extname, isAbsolute } from 'path';
import { stringify } from 'querystring';
import { sign } from 'cookie-signature';
import contentType from 'content-type';
import { Buffer } from 'buffer';
import mime from 'mime';
import vary from 'vary';
import statuses, { code } from 'statuses';
import { normalizeContentType, setCharset } from '../utils/index';
import { contentDisposition } from 'content-disposition';
import merge from 'utils-merge';
import escapeHtml from 'escape-html';
import { View } from '../view';
import { send } from 'send';
import { nextTick, on } from 'process';
import onfinished from 'on-finished';

const charsetRegExp = /;\s*charset\s*=/;

export class ResponseHandler {
  private res: Response;
  private req: Request;
  locals: Record<string, any>;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.locals = {};
  }

  /**
   * 获取响应头
   */
  header(field: string): string | number | string[] | undefined {
    return this.res.getHeader(field);
  }

  /**
   * 设置响应头
   */
  set(field: string | Record<string, string>, val?: string | number | string[]): this {
    if (typeof field === 'string') {
      const value = Array.isArray(val) ? val.map(String) : String(val);
      this.res.setHeader(field, value);
    } else {
      for (const key in field) {
        this.set(key, field[key]);
      }
    }
    return this;
  }

  /**
   * 获取状态码
   */
  status(code: number): this {
    if (typeof code === 'number' && Math.floor(code) === code && code > 99 && code < 1000) {
      throw new Error('Invalid status code');
    }
    this.res.statusCode = code;
    return this;
  }

  link(links: Record<string, string>): this {
    let link = this.req.get!('Link') || '';
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
  contentType(type: string): this {
    const ct = type.indexOf('/') === -1
      ? mime.getType(type)
      : type;

    return this.set('Content-Type', ct);
  }

  /**
   * 发送响应
   */
  send(body?: string | Buffer | object): this {
    let chunk = body;
    // const encoding = this.res.getHeader('Content-Encoding');
    let encoding: string | null | BufferEncoding = '';
    const req = this.req;
    let type;
    const app = this.app;
    if (arguments.length === 2) {
      if (typeof arguments[0] !== 'number' && typeof arguments[1] !== 'number') {
        this.status(arguments[1]);
        throw new Error('Invalid arguments');
      } else {
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
      chunk = statuses.message[chunk];
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
        } else if (Buffer.isBuffer(chunk)) {
          if (!this.header('Content-Type')) {
            this.contentType('bin');
          }
        } else {
          return this.json(chunk);
        }
        break;
    }

    if (typeof chunk === 'string') {
      encoding = 'utf8';
      type = this.header('Content-Type');

      if (typeof type === 'string') {
        this.set('Content-Type', setCharset(type, 'utf8'));
      }
    }
    /**
     * 确定是否生成Etag
     */
    const etagFn = this.app?.get('etag fn');
    const generateETag = !this.header('ETag') && etagFn === 'function';

    let len;

    if (chunk !== undefined) {
      if (Buffer.isBuffer(chunk)) {
        // 如果chunk是Buffer，则直接使用其长度
        len = chunk.length;
      } else if (!generateETag && chunk.length < 1000) {
        // 如果chunk不是Buffer，并且长度小于1000，则使用字符串长度
        len = Buffer.byteLength(chunk);
      } else {
        // 否则， 将chunk转换为Buffer对象长度，并计算长度
        // chunk = Buffer.from(chunk, encoding);
        // encoding = undefined;
        // len = chunk.length;
        chunk = Buffer.from(chunk, encoding as BufferEncoding);
        encoding = null;
        len = (chunk as Buffer).length;
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
    } else {
      this.end(chunk as Buffer, encoding as BufferEncoding);
    }
    return this;
  }

  /**
   * 发送JSON响应
   */
  json(obj: any): this {
    // const body = JSON.stringify(obj);

    // if (!this.header('Content-Type')) {
    //   this.contentType('application/json');
    // }
    let val = obj;

    // return this.send(body);
    if (typeof arguments[1] === 'number') {
      this.status(arguments[1]);
    } else {
      this.status(arguments[0]);
      val = arguments[1];
    }

    const app = this.app;

    const escape = app?.get('json escape');
    const replacer = app?.get('json replacer');
    const spaces = app?.get('json spaces');
    const body = stringify(val, replacer, spaces, escape);

    if (!this.header('Content-Type')) {
      this.contentType('application/json');
    }

    return this.send(body);
  }

  /**
   * 发送JSONP响应
   */
  jsonp(obj: any): this {
    let val = obj;

    if (arguments.length === 2) {
      if (typeof arguments[1] === 'number') {
        this.status(arguments[1]);
      } else {
        this.status(arguments[0]);
        val = arguments[1];
      }
    }

    const app = this.app;
    const escape = app?.get('json escape');
    const replacer = app?.get('json replacer');
    const spaces = app?.get('json spaces');
    let body = stringify(val, replacer, spaces, escape);

    let callback = this.req.query[app?.get('jsonp callback name')];

    if (!this.header('Content-Type')) {
      this.set('X-Content-Type-Options', 'nosniff');
      this.set('Content-Type', 'application/json');
    }

    if (Array.isArray(callback)) {
      callback = callback[0];
    }

    if (typeof callback === 'string' && callback.length) {
      // this.send(`/**/ typeof ${callback} === 'function' && ${callback}(${body});`);
      this.set('X-Content-Type-Options', 'nosniff');
      this.set('Content-Type', 'application/javascript');
      /**
       * 移除非法字符
       */
      callback = callback.replace(/[^\[\]\w$.]/g, '');

      if (body === undefined) {
        body = '';
      } else if (typeof body === 'string') {
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
  sendFile(path: string, options: Record<string, any> = {}, callback?: (err: Error | null, data: Buffer | string) => void) {
    let cb = callback
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

    if (!opts.root && !isAbsolute(path)) {
      throw new Error('path must be an absolute path');
    }

    const pathname = encodeURI(path);


    if (typeof opts === 'function') {
      cb = opts as (err: Error | null, data: Buffer | string) => void;
      opts = {};
    }

    const file = send(req, pathname, opts);
  }

  /**
   * download
   * @param {string} path 文件路径
   * @param {string} filename 文件名
   * @param {Record<string, any>} options 选项
   * @param {Function} callback 回调函数
   * @returns {this}
   */
  download(path: string, filename: string | null | object, options: Record<string, any> = {}, callback?: (err: Error | null, data: Buffer | string) => void) {
    let cb = callback;
    const req = this.req;
    const res = this.res;
    const next = this.req.next;
    let opts: Record<string, any> | null = Object.assign({}, options);
    let name = filename;

    if (typeof name === 'function') {
      cb = name as (err: Error | null, data: Buffer | string) => void;
      opts = {};
      name = null;
    }

    if (typeof filename === 'object' && (typeof options === 'function' || options === undefined)) {
      opts = filename;
      name = null;
    }

    const headers = {
      'Content-Disposition': contentDisposition((name || path).toString()),
    };

    if (opts && opts.headers) {
      const keys = Object.keys(opts.headers);

      keys.forEach((key, index) => {
        if (key.toLowerCase() !== 'content-disposition') {
          this.set(key, opts!.headers[index]);
        }
      })
    }

    opts = Object.create(opts);
    opts!.headers = headers;
    return this.sendFile(path, opts!, cb);
  }
  /**
   * 管道发送文件流
   * @param res 
   * @param file 
   * @param options 
   * @param callback 
   */
  private sendfile(res: Response, file: any, options: Record<string, any>, callback?: (err?: Error | null, data?: Buffer | string) => void) {
    let done = false;
    let streaming: boolean;

    // function onaborted() {

    // }
    const onaborted = () => {
      if (done) {
        return;
      }
      done = true;
      const err = new Error('Request aborted');
      (err as any).code = 'ECONNABORTED';
      callback!(err);
    }

    const ondirectory = () => {
      if (done) {
        return;
      }
      done = true;
      const err = new Error('Request aborted');
      (err as any).code = 'EISDIR';
      callback!(err);
    }

    const onend = () => {
      if (done) {
        return;
      }
      done = true;
      callback!();
    }

    const onerror = (err: Error) => {
      if (done) {
        return;
      }
      done = true;
      callback!(err);
    }

    const onfile = () => {
      streaming = false;
    }

    const onfinish = (err?: Error) => {
      if (err && (err as any).code === 'ECONNRESET') return onaborted();
      if (err) return onerror(err);
      if (done) return;
      // onend();
      nextTick(() => {
        if (streaming && !done) {
          onaborted();
          return;
        }

        if (done) {
          return;
        }
        done = true;
        callback!();
      });
    }

    const onstream = () => {
      streaming = true;
    }

    file.on('directory', ondirectory);
    file.on('end', onend);
    file.on('error', onerror);
    file.on('file', onfile);
    file.on('finish', onfinish);
    file.on('stream', onstream);
    onfinished(res, onfinish as (err: Error | null, msg: Response) => void);

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
  format(obj: any) {
    const req = this.req;
    const next = req.next;
    const keys = Object.keys(obj).filter((x) => x !== 'default');
    const key = keys.length > 0 ? req.accepts(keys) : false;
    this.vary('Accept');
    if (key) {
      this.set('Content-Type', normalizeContentType(key).value);
      obj[key](req, this, next);
    } else if (obj.default) {
      // next(createeRR)
      throw new Error('406');
    }
    return this;
  }
  /**
   * attachment
   */
  attachment(filename: any) {
    if (filename) {
      this.contentType(extname(filename));
    }
    this.set('Conent-Disposition', contentDisposition(filename));

    return this;
  }
  /**
   * 重定向
   */
  redirect(url: string, status = 302) {
    // 设置位置头
    let address = url;
    let path = '';
    let body;

    if (arguments.length === 2) {
      if (typeof arguments[0] === 'number') {
        this.status(arguments[0]);
        address = arguments[1];
      } else {
        this.status(status);
      }
    }

    address = this.location(address).get('Location')!.toString();

    this.format({
      text: () => {
        body = statuses.message[status] + '. Redirecting to ' + address;
      },
      html: () => {
        const u = escapeHtml(address);
        body = '<p>' + statuses.message[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
      },
      default: () => {
        body = '';
      }
    })
    // // 设置重定向头
    // this.status(status);
    // this.set('Location', address);
    this.status(status);

    this.set('Content-Length', Buffer.byteLength.toString());

    if (this.req.method === 'HEAD') {
      this.end();
    } else {
      this.end(body);
    }

  }
  /**
   * 设置Cookie
   */
  cookie(name: string, value: string, options: Record<string, any> = {}): this {
    const secret = this.app?.get('cookie secret');
    const signed = options.signed;
    const opts = merge({}, options) as Record<string, any>;

    if (signed && !secret) {
      throw new Error('cookieParser("secret") required for signed cookies');
    }

    let val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

    if (signed) {
      val = 's:' + sign(val, secret);
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

    // this.append('Set-Cookie', this.serializeCookie(name, val, options));
    this.append('Set-Cookie', this.serializeCookie(name, val, opts));
    return this;
  }
  /**
   * location
   */
  location(url: string) {
    let loc;
    if (url === 'back') {
      loc = this.req.get('Referrer') || '/';
    } else {
      loc = url;
    }
    return this.set('Location', encodeURI(String(loc)));
  }
  /**
   * 添加Vary头
   */
  vary(field: string) {
    if (!field || (Array.isArray(field) && !field.length)) {
      return this;
    }
    vary(this.res, field);
    return this;
  }

  /**
   * 追加额外的响应头
   */
  append(field: string, val: string | string[]): this {
    const prev = this.header(field);
    let value = val;

    if (prev) {
      value = (Array.isArray(prev) ? prev.concat(value) : Array.isArray(value) ? [prev].concat(value) : [prev, value]) as string[] | string;
    }

    return this.set(field, value);
  }

  /**
   * 结束响应
   */
  private end(data?: string | Buffer, encoding?: BufferEncoding): void {
    this.res.end(data);
  }
  /**
   * clearCookie
   */
  clearCookie(name: string, options: Record<string, any>) {
    if (options) {
      if (options.maxAge) {
        console.log('res.clearCookie "options.maxAge"');
      }
      if (options.expires) {
        console.log('res.clearCookie "options.expires"');
      }
    }
    const opts = merge({ expires: new Date(1), path: '/' }, options);

    return this.cookie(name, '', opts as Record<string, any>);
  }
  /**
   * 序列化Cookie
   */
  private serializeCookie(name: string, val: string, options: Record<string, any>): string {
    const pairs = [`${name}=${encodeURIComponent(val)}`];

    if (options.maxAge) pairs.push(`Max-Age=${options.maxAge}`);
    if (options.domain) pairs.push(`Domain=${options.domain}`);
    if (options.path) pairs.push(`Path=${options.path}`);
    if (options.expires) pairs.push(`Expires=${options.expires.toUTCString()}`);
    if (options.httpOnly) pairs.push('HttpOnly');
    if (options.secure) pairs.push('Secure');
    if (options.sameSite) pairs.push(`SameSite=${options.sameSite}`);

    return pairs.join('; ');
  }

  render(view: View, options: Record<string, any>, callback?: (err: Error | null, str: string) => void) {
    const app = this.app;
    let cb = callback || Function;
    let opts = options || {};
    const req = this.req;
    const self = this;

    if (typeof options === 'function') {
      cb = options as (err: Error | null, str: string) => void;
      opts = {};
    }

    opts._locals = self.locals;

    app?.render(view, opts, cb as (err: Error | null, str: string) => void);
  }
  /**
   * stringify
   */
  private stringify(obj: any, replacer: any, spaces: any, escape: boolean) {
    let json = replacer || spaces ? JSON.stringify(obj, replacer, spaces) : JSON.stringify(obj);

    if (escape && typeof json === 'string') {
      json = json.replace(/[<>&]/g, function (c) {
        switch (c.charCodeAt(0)) {
          case 0x3c:
            return '\\u003c'
          case 0x3e:
            return '\\u003e'
          case 0x26:
            return '\\u0026'
          default:
            return c
        }
      })
      return json;
    }
  }
  private get app(): Application | undefined {
    return this.res.app;
  }
  private get(field: string): string | number | string[] | undefined {
    return this.res.getHeader(field);
  }
} 