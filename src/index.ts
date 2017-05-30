import 'reflect-metadata';

import { appConfig } from './config';
import { AppRouter } from './router';
import { SlackRadioServer } from './core/server';

import * as Slackbots from 'slackbots';
import { Player } from './player/player';
import { SlackBot } from './slackbot/slackbot';
import { PlayerEvent } from './player/player-event';
import { EventTypes } from './player/player.events';

const server = new SlackRadioServer();
AppRouter.init(server.app);
server.start();

const player = new Player();
const bot = new SlackBot(new Slackbots(appConfig.slackBot), player);
let lastEvent;

player.playerEvents$.subscribe(event => {
  lastEvent = event;
  server.io.emit('PLAYER_ACTION', event);
});

server.io.on('connection', function (socket) {
  lastEvent.state.time = player.getCurrentTime();
  socket.emit('PLAYER_ACTION', lastEvent);
});

