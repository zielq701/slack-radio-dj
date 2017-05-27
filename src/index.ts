import 'reflect-metadata';

import { appConfig } from './config';
import { AppRouter } from './router';
import { SlackRadioServer } from './core/server';

import * as SlackBot from 'slackbots';
import { PlayerComponent } from './component/player.component';
import { SlackComponent } from './component/slack.component';

let lastUrl;

const server = new SlackRadioServer();
AppRouter.init(server.app);
server.start();

const player = new PlayerComponent();

player.currentSong$.subscribe(url => {
  lastUrl = url;
  server.io.emit('audioUrl', url);
});

server.io.on('connection', function (socket) {
  socket.emit('audioUrl', lastUrl);
});

const slack = new SlackComponent(new SlackBot(appConfig.slackBot), player);
