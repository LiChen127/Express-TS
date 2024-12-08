/**
 * 入口文件
 */
import { Application } from './application';

export function createApplication(): Application {
  return new Application();
}

export default createApplication;
