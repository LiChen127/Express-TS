/**
 * 类型定义
 */

import { IncomingMessage, ServerResponse } from 'http';
/** 请求对象类型 */
export interface Request extends IncomingMessage {
  /** 请求路径 */
  url: string;
  /** BASEURL */
  baseUrl: string;
  /** 原始URL */
  originalUrl: string;
  /** 请求方法 */
  method: string;
  /** 请求头 */
  headers: any;
  /** 请求体 */
  body: any;
  /** 请求参数 */
  query: any;
  /** 请求参数 */
  params: any;
  /** 请求参数 */
  path: string;
  /** 请求路径 */
  pathname: string;
  /** set方法  */
  set: (key: string, value: any) => void;
  /** get方法 */
  get: (key: string) => any;
  /** 添加方法 */
  // appendMethods: (methods: string[]) => void;
  next: NextFunction;
}

/** 响应对象类型 */
export interface Response extends ServerResponse {
  /** set方法 */
  set: (key: string, value: any) => void;
  /** get方法 */
  get: (key: string) => any;
  /** send方法 */
  send: (body: any) => void;
  /** 发送OPTIONS 响应 */
  sendOptions: (options: any[], done: Function) => void;
  /** 发送错误响应 */
  sendError: (err: any) => void;
  /** 发送404响应 */
  sendNotFound: () => void;
  /** 发送500响应 */
  sendServerError: (err: any) => void;
  /** next方法 */
  next: NextFunction;
}

/** Next 函数类型 */
export type NextFunction = {
  (err?: any): void;
  restore: (options: any, ...keys: string[]) => () => void;
}

/** 请求处理器类型 */
export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

export interface RestoreFunction {
  fn: Function;
  obj: any;
  keys: string[];
}