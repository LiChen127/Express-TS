'use strict';
/**
 * Utility class for object operations
 * Provide static methods for object
 */

/**
 * 模块依赖
 */
import { Buffer } from 'safe-buffer';
import { contentDisposition } from 'content-disposition';
import * as contentType from 'content-type';
import { flatten } from 'array-flatten';
import etag from 'etag';
import qs from 'qs';
import querystring from 'querystring';
import proxyaddr from 'proxy-addr';
import mime from 'mime';
class Utils {
  /**
   * Mixin property descriptors from the source object into the destination object
   * @param destination - Destination object
   * @param source - Source object
   * @param overwrite - Overwrite flag
   * @returns Mixed object
   * @throws TypeError if destination or source is not provided
   */
  static mixin<T extends object, U extends object>(destination: T, source: U, overwrite = true): T & U {
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
      Object.defineProperty(destination, name, descriptor!);
    }
    /**
     * Mixin property descriptors from the source object into the destination object
     */
    for (const symbol of Object.getOwnPropertySymbols(source)) {
      if (!overwrite && Object.prototype.hasOwnProperty.call(destination, symbol)) {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(source, symbol);
      Object.defineProperty(destination, symbol, descriptor!);
    }
    return destination as T & U;
  }
  /**
   * Generate etag for `body`
   * @param {String|Buffer} body
   * @param {String} [encoding]
   * @return {String}
   */
  static createEtag(body: string | Buffer, encoding?: string): string {
    const buffer = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;
    return etag(buffer, { weak: false });  // strong ETag
  }
  /**
   * Generate weak etag for `body`
   * @param {String|Buffer} body
   * @param {String} [encoding]
   * @return {String}
   */
  static createWeakEtag(body: string | Buffer, encoding?: string): string {
    const buffer = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;
    return etag(buffer, { weak: true });  // weak ETag
  }
  /**
   * Normalze a content type (e.g., 'html -> text/html')
   * @param {String} type
   * @return {Object}
   */
  static normalizeContentType(type: string) {
    return ~type.indexOf('/')
      ? Utils.acceptParams(type)
      : { value: mime.getType(type) || 'application/octet-stream', params: {} };
  }

  /**
   * Flatten an array
   * @param {Array} array
   * @return {Array}
   */
  static flattenArray(array: Array<any>): Array<any> {
    return flatten(array);
  }
  /**
   * Parse an accept parameter string and return an object with '.value', '.quality',  and '.params' properties
   * @param {String} str
   * @return {Object}
   */
  private static acceptParams(str: string): {
    value: string;
    quality: number;
    params: { [key: string]: string } // 索引签名
  } {
    const parts = str.split(/ *; */);
    const result = { value: parts[0], quality: 1, params: {} as { [key: string]: string } };

    parts.forEach(part => {
      const pms = part.split(/ *= */);
      if ('q' === pms[0]) {
        result.quality = parseFloat(pms[1]);
      } else {
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
  static setCharset(type: string, charset: string): string {
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
  static compileETag(val: boolean | string | Function): Function | undefined {
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
  static compileQueryParser(val: string | Function | boolean): Function {
    switch (val) {
      case true:
      case 'simple':
        return querystring.parse;
      case false:
        return () => { };
      case 'extended':
        return qs.parse;
      default:
        throw new Error('Invalid query parser');
    }
  }

  /**
   * Compile proxy trust function based on provided configuration
   * @param {Boolean|String|Number|Array|Function} val
   * @return {Function}
   */
  static compileTrust(val: boolean | string | number | Array<any> | Function): Function {
    if (typeof val === 'function') {
      return val;
    }

    if (val) {
      return () => true;
    }

    if (typeof val === 'string') {
      val = val.split(',').map(ip => ip.trim());
    }

    return proxyaddr.compile(val || []);
  }
}

const mixin = Utils.mixin;
const createEtag = Utils.createEtag;
const wetag = Utils.createWeakEtag;
const compileTrust = Utils.compileTrust;
const normalizeContentType = Utils.normalizeContentType;
const flattenArray = Utils.flattenArray;
// const contentDisposition = Utils.contentDisposition;
const setCharset = Utils.setCharset;
const compileETag = Utils.compileETag;
const compileQueryParser = Utils.compileQueryParser;

export {
  mixin,
  createEtag,
  wetag,
  compileTrust,
  normalizeContentType,
  flattenArray,
  // contentDisposition,
  setCharset,
  compileETag,
  compileQueryParser
};
