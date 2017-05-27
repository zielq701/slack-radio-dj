import { Db, MongoClient } from 'mongodb';

const url = 'mongodb://126.126.1.2/songs';

export class MongoDBConnection {
  private static isConnected = false;
  private static db: Db;

  static async getConnection(): Promise<Db> {
    return new Promise<Db>((resolve, reject) => {
      if (this.isConnected) {
        resolve(this.db);
      } else {
        this.connect((error, db: Db) => {
          if (error) {
            reject(error);
          } else {
            resolve(this.db);
          }
        });
      }
    });
  }

  private static connect(result: (error, db: Db) => void): void {
    MongoClient.connect(url, (error, db: Db) => {
      this.db = db;
      this.isConnected = true;

      return result(error, db);
    });
  }
}
