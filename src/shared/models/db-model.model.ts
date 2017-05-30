import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Model, ModelProp } from './model.model';
import { MongoDBConnection } from '../../db/connection';

/**
 * Annotate model class with name, which corresponds to the collection in the database.
 * @param collectionName
 * @returns {(target:any)=>undefined}
 * @constructor
 */
export function DbModelClass(collectionName: string): ClassDecorator {
  return (target) => {
    target.__collection__ = collectionName;
  };
}

export class DbModel extends Model {
  @ModelProp()
  _id: string;

  static find<T>(filter: Object): Observable<T[]> {
    const collection = (<any>this).__collection__;
    const subject = new Subject<T[]>();

    MongoDBConnection.getConnection().subscribe(db => {
      db.collection(collection).find(filter).toArray((error, find) => {
        if (error) {
          return subject.error(error);
        }
        subject.next(<T[]>find.map(e => (<any>this).deserialize(e)));
        subject.complete();
      });
    });

    return subject;
  }

  /**
   * @param {Object} filter
   * @returns {Subject<T>}
   */
  static findOne<T>(filter: Object): Observable<T | null> {
    const collection = (<any>this).__collection__;
    const subject = new Subject<T | null>();

    MongoDBConnection.getConnection().subscribe(db => {
      db.collection(collection).find(filter).limit(1).toArray((error, find) => {
        if (error) {
          return subject.error(error);
        }

        if (find.length) {
          subject.next(<T>(<any>this).deserialize(find[0]));
        } else {
          subject.next(null);
        }

        subject.complete();
      });
    });

    return subject;
  }

  /**
   * @param {string} id
   * @returns {Subject<T>}
   */
  static findOneById<T>(id: string): Observable<T | null> {
    const collection = (<any>this).__collection__;
    const subject = new Subject<T | null>();

    MongoDBConnection.getConnection().subscribe(db => {
      db.collection(collection).find({_id: id}).limit(1).toArray((error, find) => {
        if (error) {
          return subject.error(error);
        }

        if (find.length) {
          subject.next(<T>(<any>this).deserialize(find[0]));
        } else {
          subject.next(null);
        }

        subject.complete();
      });
    });

    return subject;
  }

  /**
   * @param {string} id
   * @returns {Subject<T>}
   */
  static remove<T>(id: string): Observable<T | null> {
    const collection = (<any>this).__collection__;
    const subject = new Subject<T | null>();

    MongoDBConnection.getConnection().subscribe(db => {
      db.collection(collection).deleteOne({_id: id}, (error, remove) => {
        if (error) {
          return subject.error(error);
        }

        subject.next((<any>this).deserialize(remove));
        subject.complete();
      });
    });

    return subject;
  }

  constructor() {
    super();
    if (!(<any>this.constructor).__collection__) {
      throw new Error(`No collection name specified for ${this.constructor.name}.
      Please use ModelClass decorator to provide collection name for model.`);
    }
  }

  /**
   * Save model to database.
   * @returns {Subject<T>}
   */
  save<T>(): Observable<T> {
    const collection = (<any>this).__collection__;
    const subject = new Subject<T | null>();

    MongoDBConnection.getConnection().subscribe(db => {
      if (this._id) {
        db.collection(collection).updateOne({_id: this._id}, this.serialize(), (error, save) => {
          if (error) {
            subject.error(error);
          }

          subject.next(<T>((<any>this).deserialize(save)));
          subject.complete();
        });
      } else {
        db.collection(collection).insertOne(this.serialize(), (error, save) => {
          if (error) {
            subject.error(error);
          }

          subject.next(<T>((<any>this).deserialize(save)));
          subject.complete();
        });
      }
    });

    return subject;
  }
}
