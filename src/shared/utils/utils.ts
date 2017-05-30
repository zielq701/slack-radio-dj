export class Utils {
  /**
   * Check if object is empty.
   * @param obj
   * @returns {boolean}
   */
  static isEmptyObj(obj): boolean {
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate uuid.
   * @returns {string}
   */
  static uuid(): string {
    let d = new Date().getTime();

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /**
   * Check if provided value is primitive type.
   * @param {any} value
   * @returns {boolean}
   */
  static isPrimitive(value: any): boolean {
    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean':
        return true;
    }
    return (value instanceof String || value === String ||
    value instanceof Number || value === Number ||
    value instanceof Boolean || value === Boolean);
  }

  /**
   * Check if provided value is array.
   * @param {any} value
   * @returns {boolean}
   */
  static isArray(value: any): boolean {
    if (value === Array) {
      return true;
    } else if (typeof Array.isArray === 'function') {
      return Array.isArray(value);
    } else {
      return value instanceof Array;
    }
  }

  static drawRandomElementFromArray(arr: any[]): any {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
