import path from 'path';
import { SERVER } from '../common/constants';

import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
const port = SERVER.PORT;

import geckos, { ServerChannel, iceServers } from '@geckos.io/server';
const io = geckos({
  iceServers: process.env.NODE_ENV === 'production' ? iceServers : [],
});

import ServerGame from './game';
import GameMap from '../common/gameMap';

io.addServer(server);

app.use('/', express.static(path.join(__dirname, '../../public')));
app.use('/', express.static(path.join(__dirname, '../../dist')));

type Player = {
  channel_id?: string;
  player_id: number;
  channel: ServerChannel;
  ready: boolean;
  name: string;
};

let client_id = 0;
const player_list: Player[] = [];
let game: ServerGame | undefined;

function startGame(maxMessageSize?: number): void {
  // normalize the players' IDs
  for (let i = 0; i < player_list.length; i++) {
    player_list[i].player_id = i;
  }

  game = new ServerGame(
    new GameMap('scifi-1', 'scifi'),
    x => {
      if (maxMessageSize !== undefined && x.byteLength > maxMessageSize) {
        console.warn(
          `Message probably too big! ${x.byteLength} > ${maxMessageSize}`,
        );
      }
      io.raw.room().emit(x);
    },
    Array.from(player_list.map(p => p.player_id)),
  );

  const all_names = {};
  for (const p of player_list) {
    all_names[p.player_id] = p.name;
  }

  for (const p of player_list) {
    p.channel.emit(
      'start',
      { id: p.player_id, map: 'scifi-1', tileset: 'scifi', names: all_names },
      { reliable: true },
    );
    p.channel.onRaw(data => game?.clientMsg(p.player_id, data));
  }

  game.start().then(() => {
    console.info('game done');
    if (game === undefined) {
      throw new Error("game can't possibly be undefined here");
    }

    const playersToSend: { id: number; score: number }[] = [];
    for (const p of Object.values(game.state.players)) {
      playersToSend.push({ id: p.id, score: p.score });
    }

    for (const p of player_list) {
      p.channel.emit(
        'game_over',
        { players: playersToSend },
        { reliable: true },
      );
      p.channel.close();
    }
    game = undefined;
  });
}

io.onConnection(channel => {
  if (game !== undefined || player_list.length >= SERVER.PLAYER_LIMIT) {
    console.info(
      'ignoring new connection because the game has already started or there are too many players connected',
    );
    // TODO: the client's onDisconnect is not fired immediately for some reason.
    // And it is spewing errors.
    channel.close();
    return;
  }

  console.info(`${channel.id} connected`);

  channel.onDrop(drop => {
    if (drop['reason'] !== 'DROPPED_FROM_BUFFERING') {
      console.warn('We are dropping packets: ', drop);
    }
  });

  const my_id = client_id;
  client_id += 1;
  player_list.push({
    channel_id: channel.id,
    player_id: my_id,
    channel: channel,
    ready: false,
    name: 'default',
  });

  channel.onDisconnect(() => {
    console.info(`${channel.id} disconnected`);
    const i = player_list.findIndex(x => x.player_id === my_id);
    if (i >= 0) {
      player_list.splice(i, 1);
      if (player_list.length === 0) {
        game?.stop();
        client_id = 0;
      }
    }
  });

  channel.on('ready', data => {
    if (game !== undefined) return;

    const status = data['status'];
    const name = data['name'];
    const index = player_list.findIndex(p => p.player_id === my_id);

    if (index >= 0) {
      player_list[index].ready = status;
      player_list[index].name = name;

      if (player_list.every(p => p.ready)) {
        const { maxMessageSize } = channel;
        startGame(maxMessageSize);
      }
    }
  });
});

if ((process.env.NODE_SERVER_TEST ?? '') === '') {
  server.listen(port, '0.0.0.0', () => {
    console.info(`spela spel gratis på http://localhost:${port}`);
  });
}
