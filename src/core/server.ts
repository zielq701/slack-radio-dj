import { Express } from 'express';
import { Server } from 'http';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as socketIo from 'socket.io';

export class SlackRadioServer {
  static readonly PORT = 8888;
  app: Express;
  io: SocketIO.Server;

  private port: number;
  private server: Server;

  constructor(port?: number) {
    this.createApp();
    this.config(port);
    this.createServer();
    this.sockets();
  }

  /**
   * Start express and socket.io servers on given port.
   */
  start() {
    this.server.listen(this.port, () => {
      console.log('Running server on port %s', this.port);
    });
  }

  /**
   * Set basic config for servers. Only port is here for now.
   * @param {number} port
   */
  private config(port?: number): void {
    this.port = port || process.env.PORT || SlackRadioServer.PORT;
  }

  private createApp(): void {
    this.app = express();

    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  private createServer(): void {
    this.server = http.createServer(this.app);
  }

  private sockets(): void {
    this.io = socketIo(this.server);
  }
}
