/// <reference types="node" />
/// <reference types="node" />
import { Request, Response } from '../type/index';
import { Buffer } from 'buffer';
import { View } from '../view';
export declare class ResponseHandler {
    private res;
    private req;
    locals: Record<string, any>;
    constructor(req: Request, res: Response);
    /**
     * 获取响应头
     */
    header(field: string, val?: string | number | string[]): string | number | string[] | undefined;
    /**
     * 设置响应头
     */
    set(field: string | Record<string, string>, val?: string | number | string[]): this;
    /**
     * 获取状态码
     */
    status(code: number): this;
    link(links: Record<string, string>): this;
    /**
     * 设置Content-Type
     */
    contentType(type: string): this;
    /**
     * 发送响应
     */
    send(body?: string | Buffer | object): this;
    /**
     * 发送JSON响应
     */
    json(obj: any): this;
    /**
     * 发送JSONP响应
     */
    jsonp(obj: any): this;
    /**
     * 传输给定 path 的文件
     */
    sendFile(path: string, options?: Record<string, any>, callback?: (err: Error | null, data: Buffer | string) => void): void;
    /**
     * download
     * @param {string} path 文件路径
     * @param {string} filename 文件名
     * @param {Record<string, any>} options 选项
     * @param {Function} callback 回调函数
     * @returns {this}
     */
    download(path: string, filename: string | null | object, options?: Record<string, any>, callback?: (err: Error | null, data: Buffer | string) => void): void;
    /**
     * 管道发送文件流
     * @param res
     * @param file
     * @param options
     * @param callback
     */
    private sendfile;
    /**
     * format
     * @param {*} obj
     */
    format(obj: any): this;
    /**
     * attachment
     */
    attachment(filename: any): this;
    /**
     * 重定向
     */
    redirect(url: string, status?: number): void;
    /**
     * 设置Cookie
     */
    cookie(name: string, value: string, options?: Record<string, any>): this;
    /**
     * location
     */
    location(url: string): this;
    /**
     * 添加Vary头
     */
    vary(field: string): this;
    /**
     * 追加额外的响应头
     */
    append(field: string, val: string | string[]): this;
    /**
     * 结束响应
     */
    private end;
    /**
     * clearCookie
     */
    clearCookie(name: string, options: Record<string, any>): this;
    /**
     * 序列化Cookie
     */
    private serializeCookie;
    render(view: View, options: Record<string, any>, callback?: (err: Error | null, str: string) => void): void;
    /**
     * stringify
     */
    private stringify;
    private get app();
    private get;
}
