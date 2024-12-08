import { Application } from './core/application';
import { Request, Response } from './core/type';

function createApplication(): Application {
  const app = new Application();

  // 继承 EventEmitter
  Object.setPrototypeOf(app, Application.prototype);

  // 初始化请求和响应对象
  app.request = Object.create(Request.prototype);
  app.response = Object.create(Response.prototype);

  return app;
}

export default createApplication;
