import 'reflect-metadata';

import { appConfig } from './config';
import { AppRouter } from './router';
import { SlackRadioServer } from './core/server';

import * as SlackBot from 'slackbots';
import { PlayerComponent, PlayerState } from './component/player.component';
import { SlackComponent } from './component/slack.component';

let lastPlayerState: PlayerState;
let lastThumbsDown: number;

const server = new SlackRadioServer();
AppRouter.init(server.app);
server.start();

const player = new PlayerComponent();

player.currentSong$.subscribe(playerState => {
  lastPlayerState = playerState;
  server.io.emit('playerState', playerState);
});

player.playlist$.subscribe(playlist => {
  server.io.emit('playlistUpdate', playlist);
});

player.currentSongThumbsDown$.subscribe(thumbsDown => {
  lastThumbsDown = thumbsDown;
  console.log(thumbsDown);
  server.io.emit('thumbsDown', thumbsDown);
});

server.io.on('connection', function (socket) {
  lastPlayerState.time = player.getCurrentTime();
  socket.emit('playerState', lastPlayerState);
  socket.emit('thumbsDown', lastThumbsDown);
  socket.on('getCurrentPlayerState', () => {
    lastPlayerState.time = player.getCurrentTime();
    socket.emit('playerState', lastPlayerState);
  });
});

const slack = new SlackComponent(new SlackBot(appConfig.slackBot), player);
