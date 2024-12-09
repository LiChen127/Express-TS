/**
 * 类型定义
 */

import { IncomingMessage, ServerResponse } from 'http';
import { View } from '../view';

export interface Application {
  get(setting: string): any;
  set(setting: string, value: any): this;
  enabled(setting: string): boolean;
  disabled(setting: string): boolean;
  enable(setting: string): this;
  disable(setting: string): this;
  render(view: View, options: Record<string, any>, callback?: (err: Error | null, str: string) => void): void;
}

/** 请求对象类型 */
export interface Request extends IncomingMessage {
  app?: Application;
  body?: any;
  query?: any;
  params?: any;
  baseUrl?: string;
  originalUrl?: string;
  path?: string;
  hostname?: string;
  fresh?: boolean;
  next?: NextFunction;
  get(field: string): string | number | string[] | undefined;
  accepts(types: string | string[]): string | false | undefined;
}

/** 响应对象类型 */
export interface Response extends ServerResponse {
  app?: Application;
  locals?: any;
  getHeader(name: string): string | number | string[] | undefined;

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
