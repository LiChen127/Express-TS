import { ViewOptions } from './type/index';
/**
 * 定义View类
 */
export declare class View {
    private defaultEngine;
    private ext;
    private options;
    private root;
    private engine;
    private path;
    private filename;
    constructor(name: string, options: ViewOptions);
    /**
     * 查找视图文件路径
     * @param name 视图文件名
     * @returns 视图文件路径
     */
    private lookup;
    /**
     * 渲染视图
     * @param options 渲染选项
     * @param callback 回调函数
     * @returns 渲染结果
     */
    render(options: any, callback: Function): any;
    /**
     * 解析路径
     * @param dir 目录
     * @param file 文件
     * @returns 路径
     */
    resolve(dir: string, file: string): string;
    /**
     * 尝试获取文件状态
     * @param path 路径
     * @returns 文件状态
     */
    private tryStat;
}
