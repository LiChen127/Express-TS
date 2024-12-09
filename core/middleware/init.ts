'use strict';
/**
 * 初始化中间件
 */

import setPrototypeOf from 'setprototypeof';
import { Application, NextFunction, Request, Response } from '../type';

// export default function init(app: Application) {

// }

class Init {
  private app: Application;
  constructor(app: Application) {
    this.app = app;
  }

  static expressInit(req: Request, res: Response, next: NextFunction) {
    if (this.app.enabled('x-powered-by')) {
      res.setHeader('X-Powered-By', 'Express');
    }
    req.res = res;
    res.req = req;
    req.next = next;

    setPrototypeOf(req, Request.prototype);
    setPrototypeOf(res, Response.prototype);

    res.locals = res.locals || Object.create(null);

    next();
  }
}

const ExpressInit = Init.expressInit;

export default ExpressInit;
