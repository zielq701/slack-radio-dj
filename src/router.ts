import { Express, Request, Response, Router } from 'express';
import * as path from 'path';

export class AppRouter {
  static init(app: Express) {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.use('/', router);
  }
}
