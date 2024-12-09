'use strict';
/**
 * query 中间件
 */

import merge from 'utils-merge';
import parseurl from 'parseurl';
import qs from 'qs';
import { NextFunction, Request, Response } from '../type';

export default function query(options: any) {
  let opts = merge({}, options);
  let queryparse = qs.parse;

  if (typeof options === 'function') {
    queryparse = options;
    opts = undefined;
  }

  if (opts !== undefined && opts!.allowPrototypes === undefined) {
    opts!.allowPrototypes = true;
  }

  return function query(req: Request, res: Response, next: NextFunction) {
    if (!req.query) {
      const val = parseurl(req as any)!.query;
      req.query = queryparse(val as any, opts);
    }

    next();
  }
}
