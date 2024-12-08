'use strict';
/**
 * Utility class for object operations
 * Provide static methods for object
 */
class Utils {
  /**
   * Mixin property descriptors from the source object into the destination object
   * @param destination - Destination object
   * @param source - Source object
   * @param overwrite - Overwrite flag
   * @returns Mixed object
   * @throws TypeError if destination or source is not provided
   */
  static mixin<T extends object, U extends object>(destination: T, source: U, overwrite = true): T & U {
    if (!destination) {
      throw new TypeError('The `destination` argument is required.');
    }
    if (!source) {
      throw new TypeError('The `source` argument is required.');
    }
    /**
     * Mixin property descriptors from the source object into the destination object
     */
    for (const name of Object.getOwnPropertyNames(source)) {
      if (!overwrite && Object.prototype.hasOwnProperty.call(destination, name)) {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(source, name);
      Object.defineProperty(destination, name, descriptor!);
    }
    /**
     * Mixin property descriptors from the source object into the destination object
     */
    for (const symbol of Object.getOwnPropertySymbols(source)) {
      if (!overwrite && Object.prototype.hasOwnProperty.call(destination, symbol)) {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(source, symbol);
      Object.defineProperty(destination, symbol, descriptor!);
    }
    return destination as T & U;
  }
}

const mixin = Utils.mixin;

export { mixin };
