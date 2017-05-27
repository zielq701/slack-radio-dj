import { Utils } from '../utils/utils';
import { ObjectID } from 'mongodb';
import { MongoDBConnection } from '../db/connection';

const propertyDecoratorKey = '__ModelProp__';

export function ModelClass(collectionName: string): ClassDecorator {
  return (target) => {
    target.__collection__ = collectionName;
  };
}

/**
 * Annotate properties which should be deserializable.
 * @param {any} [type] - class which should be used during creation of object e.g.:
 * <code>
 * class Animal extends Model {
 *   @ModelProp()
 *   name: string;
 * }
 *
 * class Dog extends Animal {
 * }
 *
 * class Person extends Model {
 *   @ModelProp()
 *   name: string;
 *   @ModelProp(Dog) // <---- Dog class will be used during creating array of Dogs objects
 *   dogs: Dog[]
 * }
 * </code>
 * @returns {PropertyDecorator}
 */
export function ModelProp(type?: any): PropertyDecorator {
  return (target, property) => {
    const classConstructor = target.constructor;
    const metadata = type || Reflect.getMetadata('design:type', target, property) || undefined;

    Reflect.defineMetadata(propertyDecoratorKey, metadata, classConstructor, property);
  };
}

export abstract class Model {
  @ModelProp()
  protected _id: string;

  constructor() {
    if (!(<any>this.constructor).__collection__) {
      throw new Error(`No collection name specified for ${this.constructor.name}. 
      Please use ModelClass decorator to provide collection name for model.`);
    }
  }

  /**
   * Parse provided object (e.g. data from server) into model instance. E.g.:
   * <code>
   *   const animal = Animal.deserialize<Animal>(dataFromServer);
   * </code>
   * @Todo: Support for multidimensional arrays.
   * @param {any} data
   * @returns {T}
   */
  static deserialize<T extends Model>(data: any): T | null {
    if (!data || (Utils.isArray(data) && !data.length)) {
      return null;
    }

    const obj = new (<any>this)();

    Object.keys(data).forEach((key) => {
      const metadata = Reflect.getMetadata(propertyDecoratorKey, this, key);
      // Return if provided key doesn't mach any decorated class member.
      if (!metadata) {
        return;
      }
      if (Utils.isPrimitive(data[key]) && Utils.isPrimitive(metadata)) {
        // Value is primitive type, assign it to object.
        obj[key] = data[key];

      } else if (Utils.isArray(data[key])) {
        // If decorated property is type of array assign it to object. It means that values of array are primitive type.
        if (Utils.isArray(metadata)) {
          obj[key] = data[key];
        } else {
          // If decorated property specified own type, deserialize it.
          obj[key] = [];
          data[key].forEach((arrObj) => {
            obj[key].push(metadata.deserialize ? metadata.deserialize(arrObj) : new metadata(data[key]));
          });
        }

      } else {
        // If is object and have deserialize method
        if (metadata.deserialize) {
          obj[key] = metadata.deserialize(data[key]);
        } else {
          if (data[key]) {
            // If is instance of object just call new with provided data (e.g. Date)
            obj[key] = new metadata(data[key]);
          } else {
            obj[key] = data[key];
          }
        }
      }
    });

    return <T>obj;
  }

  /**
   * Serialize and return plain object. It doesn't support circular references.
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

  static async find<T>(filter: Object): Promise<T[]> {
    const db = await MongoDBConnection.getConnection();
    const collection = (<any>this).__collection__;

    return new Promise<T[]>((resolve, reject) => {
      db.collection(collection).find(filter).toArray((error, find) => {
        if (error) { return reject(error); }
        resolve(<T[]>find.map(e => (<any>this).deserialize(e)));
      });
    });
  }

  static async findOne<T>(filter: Object): Promise<T | null> {
    const db = await MongoDBConnection.getConnection();
    const collection = (<any>this).__collection__;

    return new Promise<T>((resolve, reject) => {
      db.collection(collection).find(filter).limit(1).toArray((error, find) => {
        if (error) { return reject(error); }
        resolve(<T>(<any>this).deserialize(find.length ? find[0] : null));
      });
    });
  }

  static async findOneById<T>(id: string): Promise<T | null> {
    const db = await MongoDBConnection.getConnection();
    const collection = (<any>this).__collection__;

    return new Promise<T>((resolve, reject) => {
      db.collection(collection).find({_id: new ObjectID(id)}).limit(1).toArray((error, find) => {
        if (error) { return reject(error); }
        resolve(<T>(<any>this).deserialize(find.length ? find[0] : null));
      });
    });
  }

  static async remove<T>(id: string): Promise<T | null> {
    const db = await MongoDBConnection.getConnection();
    const collection = (<any>this).__collection__;

    return new Promise<T>((resolve, reject) => {
      db.collection(collection).deleteOne({_id: new ObjectID(id)}, (error, remove) => {
        if (error) { return reject(error); }
        resolve((<any>this).deserialize(remove));
      });
    });
  }

  async save<T>(): Promise<T> {
    const db = await MongoDBConnection.getConnection();
    const collection = (<any>this.constructor).__collection__;

    return new Promise<T>((resolve, reject) => {
      if (this._id) {
        db.collection(collection).updateOne({_id: this._id}, this.serialize(), (error, data) => {
          if (error) { reject(error); }
          resolve(<T>(<any>this));
        });
      } else {
        db.collection(collection).insertOne(this.serialize(), (error, data) => {
          if (error) { reject(error); }
          resolve(<T>(<any>this));
        });
      }
    });
  }
}
