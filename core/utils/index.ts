/**
 * 工具类
 */

class UtilsForExpress {
  /**
   * @description 合并参数
   * @param {any[]} params 参数
   * @param {any} parent 父级参数
   * @returns {any[]} 合并后的参数
   */
  static mixin(params: any, parent: any): any {
    if (parent && params) {
      for (const key in parent) {
        if (params[key] === undefined) {
          params[key] = parent[key];
        }
      }
    }
    return params;
  }
}

export default UtilsForExpress;