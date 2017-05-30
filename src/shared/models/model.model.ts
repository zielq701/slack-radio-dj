import { Utils } from '../utils/utils';
const propertyDecoratorKey = '__ModelProp__';

/**
 * Annotate properties which should be deserializable.
 * @param {any} [type] - class which should be used during creating object.
 * @param {string} [sourceProperty] - name of source property, which will be mapped to target property.
 * @returns {PropertyDecorator}
 */
export function ModelProp(type?: any, sourceProperty?: string | symbol): PropertyDecorator {
  return (target, property) => {
    const source = sourceProperty || property;
    const classConstructor = target.constructor;
    const metadata = {
      type: type || Reflect.getMetadata('design:type', target, property) || undefined,
      targetProp: property
    };

    Reflect.defineMetadata(propertyDecoratorKey, metadata, classConstructor, source);
  };
}

/**
 * Base model class.
 */
export abstract class Model {
  uuid = Utils.uuid();

  /**
   * Parse provided object (e.g. data from db) into model instance.
   * @param {any} data
   * @returns {T}
   */
  static deserialize<T extends Model>(data: any): T {
    const obj = new (<any>this)();

    if (!data) {
      return obj;
    }

    // Extract additional serialized data for Oxi application.
    data = data.additionalSerializedData ? Object.assign(data, data.additionalSerializedData) : data;

    Object.keys(data).forEach((key) => {
      const metadata = Reflect.getMetadata(propertyDecoratorKey, this, key);
      // Return if provided key doesn't mach any decorated class member.
      if (!metadata) {
        return;
      }

      const targetProp = metadata.targetProp;
      let type = metadata.type;

      if (!type.name || type.name === 'anonymous') {
        type = type();
      }

      if (Utils.isPrimitive(data[key]) && Utils.isPrimitive(type)) {
        // Value is primitive type, assign it to object.
        obj[targetProp] = data[key];

      } else if (Utils.isArray(data[key])) {
        // If decorated property is type of array assign it to object. It means that values of array are primitive type.
        if (Utils.isArray(type)) {
          obj[targetProp] = data[key];
        } else {
          // If decorated property specified own type, deserialize it.
          obj[targetProp] = [];
          data[key].forEach((arrObj) => {
            obj[targetProp].push(type.deserialize ?
              type.deserialize(arrObj) : new type(data[key]));
          });
        }

      } else {
        // If is object and have deserialize method.
        if (type.deserialize) {
          obj[targetProp] = type.deserialize(data[key]);
        } else {
          if (data[key]) {
            // If is instance of object just call new with provided data (e.g. Date).

            obj[targetProp] = new type(data[key]);
          } else {
            obj[targetProp] = data[key];
          }
        }
      }
    });

    return <T>obj;
  }

  /**
   * Returns deep clone of the object.
   * @returns {T}
   */
  clone<T extends Model>(): T {
    return <T>(<any>this).constructor.deserialize(this.serialize());
  }

  /**
   * Creates new object and maps sources' properties to this newly created object's properties.
   * @param sources
   * @returns {T}
   */
  mapToModel<T extends Model>(...sources): T {
    return <T>(<any>this).constructor.deserialize(Object.assign(this.serialize(), ...sources));
  }

  /**
   * Serialize and return plain object without methods.
   * @param {string[]} exclude - array of property names which should be excluded from object (you can provide nested
   *                             properties e.g.: ['position.z']).
   * @returns {Object}
   */
  serialize(exclude?: string[]): Object {
    const obj = JSON.parse(JSON.stringify(this));

    if (exclude) {
      exclude.forEach(prop => {
        const arrProp = prop.split('.');
        const l = arrProp.length - 1;
        let toDelete = obj;

        for (let i = 0; i < l; i++) {
          if (!(arrProp[i] in toDelete)) {
            throw new Error('Property ' + prop + ' does not exist on ' + (<any>this.constructor).name);
          }
          toDelete = toDelete[arrProp[i]];
        }

        if (!(arrProp[l] in toDelete)) {
          throw new Error('Property ' + prop + ' does not exist on ' + (<any>this.constructor).name);
        }

        delete toDelete[arrProp[l]];
      });
    }

    return obj;
  }
}
