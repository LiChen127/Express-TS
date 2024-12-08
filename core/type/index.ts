/**
 * 类型定义
 */

import { IncomingMessage, ServerResponse } from 'http';
/** 请求对象类型 */
export interface Request extends IncomingMessage {
  baseUrl?: string;
  originalUrl?: string;
  body?: any;
  query?: any;
  params?: any;
  path?: string;
  pathname?: string;
  set?: (key: string, value: any) => void;
  get?: (key: string) => any;
}

/** 响应对象类型 */
export interface Response extends ServerResponse {
  set?: (key: string, value: any) => void;
  get?: (key: string) => any;
  send?: (body: any) => void;
  sendOptions?: (options: any[], done: Function) => void;
  sendError?: (err: any) => void;
  sendNotFound?: () => void;
  sendServerError?: (err: any) => void;
}

// /** Next 函数类型 */
export type NextFunction = (err?: any) => void;

/** 请求处理器类型 */
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

export interface RestoreFunction {
  fn: Function;
  obj: any;
  keys: string[];
}

export interface ViewOptions {
  /** 默认模板引擎的名称 */
  defaultEngine?: string;
  /** 默认引擎缓存对象 */
  engines: Record<string, any>;
  /** 视图文件的根目录 */
  root?: string[];
  /** 视图文件的扩展名 */
  ext?: string;
}
