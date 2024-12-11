/**
 * Utility class for object operations
 * Provide static methods for object
 */
/**
 * 模块依赖
 */
import { Buffer } from 'safe-buffer';
declare class Utils {
    /**
     * Mixin property descriptors from the source object into the destination object
     * @param destination - Destination object
     * @param source - Source object
     * @param overwrite - Overwrite flag
     * @returns Mixed object
     * @throws TypeError if destination or source is not provided
     */
    static mixin<T extends object, U extends object>(destination: T, source: U, overwrite?: boolean): T & U;
    /**
     * Generate etag for `body`
     * @param {String|Buffer} body
     * @param {String} [encoding]
     * @return {String}
     */
    static createEtag(body: string | Buffer, encoding?: string): string;
    /**
     * Generate weak etag for `body`
     * @param {String|Buffer} body
     * @param {String} [encoding]
     * @return {String}
     */
    static createWeakEtag(body: string | Buffer, encoding?: string): string;
    /**
     * Normalze a content type (e.g., 'html -> text/html')
     * @param {String} type
     * @return {Object}
     */
    static normalizeContentType(type: string): {
        value: string;
        quality: number;
        params: {
            [key: string]: string;
        };
    } | {
        value: string;
        params: {};
    };
    /**
     * Flatten an array
     * @param {Array} array
     * @return {Array}
     */
    static flattenArray(array: Array<any>): Array<any>;
    /**
     * Parse an accept parameter string and return an object with '.value', '.quality',  and '.params' properties
     * @param {String} str
     * @return {Object}
     */
    private static acceptParams;
    /**
     * Generate a Content-Dispostion header for the filename
     * @param {String} filename
     * @return {String}
     */
    /**
     * Set charset in a content-type string
     * @param {String} type
     * @param {String} charset
     * @return {String}
     */
    static setCharset(type: string, charset: string): string;
    /**
     * Compile ETag generator based on provided configuration
     * @param {Boolean|String|Function} val
     * @return {Function}
     */
    static compileETag(val: boolean | string | Function): Function | undefined;
    /**
     * Compile query parser function based on provided configuration
     * @param {String|Function} val
     * @return {Function}
     */
    static compileQueryParser(val: string | Function | boolean): Function;
    /**
     * Compile proxy trust function based on provided configuration
     * @param {Boolean|String|Number|Array|Function} val
     * @return {Function}
     */
    static compileTrust(val: boolean | string | number | Array<any> | Function): Function;
}
declare const mixin: typeof Utils.mixin;
declare const createEtag: typeof Utils.createEtag;
declare const wetag: typeof Utils.createWeakEtag;
declare const compileTrust: typeof Utils.compileTrust;
declare const normalizeContentType: typeof Utils.normalizeContentType;
declare const flattenArray: typeof Utils.flattenArray;
declare const setCharset: typeof Utils.setCharset;
declare const compileETag: typeof Utils.compileETag;
declare const compileQueryParser: typeof Utils.compileQueryParser;
export { mixin, createEtag, wetag, compileTrust, normalizeContentType, flattenArray, setCharset, compileETag, compileQueryParser };
