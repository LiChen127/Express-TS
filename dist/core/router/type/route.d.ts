/**
 * Route Type
 */
/**
 * 路由器原型
 */
/**
 * @param { Object } [options] 配置
 * @return { Router } 路由器
 * @public
 */
interface RouterPrototype {
    [key: string]: any;
}
interface RouteOptions {
    params: string[];
    stack: any[];
    strict: boolean;
    mergeParams: boolean;
    caseSensitive: boolean;
    _params: string[];
}
export { RouterPrototype, RouteOptions, };
