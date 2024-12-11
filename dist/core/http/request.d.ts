import { Request, Response } from '../type/index';
export declare class RequestHandler {
    private req;
    private res;
    constructor(req: Request, res: Response);
    /**
     * 获取请求头
     */
    header(name: string): string | string[] | undefined;
    /**
     * 获取协议
     */
    get protocol(): string;
    /**
     * 获取IP地址
     */
    get ip(): string;
    /**
     * 获取所有IP地址
     */
    get ips(): string[];
    /**
     * 获取主机名
     */
    get hostname(): string;
    /**
     * 获取子域名
     */
    get subdomains(): string[];
    /**
     * 检查内容是否新鲜
     */
    get fresh(): boolean;
    /**
     * 获取请求参数
     */
    param(name: string, defaultValue?: any): any;
    private get app();
}
