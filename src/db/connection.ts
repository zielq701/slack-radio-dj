import { Db, MongoClient } from 'mongodb';
import { appConfig } from '../config';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

export class MongoDBConnection {
  private static isConnected = false;
  private static db: Db;

  static getConnection(): Observable<Db> {
    const subject = new Subject<Db>();

    if (this.isConnected) {
      subject.next(this.db);
      subject.complete();
    } else {
      this.connect((error, db: Db) => {
        if (error) {
          subject.error(error);
        } else {
          subject.next(db);
          subject.complete();
        }
      });
    }

    return subject;
  }

  private static connect(result: (error, db: Db) => void): void {
    MongoClient.connect(appConfig.mongoDb, (error, db: Db) => {
      this.db = db;
      this.isConnected = true;

      return result(error, db);
    });
  }
}
