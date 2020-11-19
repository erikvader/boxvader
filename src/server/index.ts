import path from 'path';
import { PLAYER_LIMIT, PORT } from '../common/constants';

import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
const port = PORT;

import { default as geckos, ServerChannel } from '@geckos.io/server';
const io = geckos();

import ServerGame from './game';

io.addServer(server);

app.use('/', express.static(path.join(__dirname, '../../public')));
app.use('/', express.static(path.join(__dirname, '../../dist')));

type Player = {
  channel_id?: string;
  player_id: number;
  channel: ServerChannel;
};

let client_id = 0;
const player_list: Player[] = [];
let game: ServerGame | undefined;

function startGame() {
  game = new ServerGame(
    // TODO: check if the emitted object is too big
    x => io.raw.room().emit(x),
    Array.from(player_list.map(p => p.player_id)),
  );

  for (const p of player_list) {
    p.channel.emit('start', { id: p.player_id }, { reliable: true });
    p.channel.onRaw(data => game?.clientMsg(p.player_id, data));
  }

  game.start().then(() => {
    console.log('game done');
    game = undefined;
  });
}

io.onConnection(channel => {
  console.log(`${channel.id} connected`);
  channel.onDrop(drop => {
    console.warn(`We are dropping packets: ${drop}`);
  });

  const my_id = client_id;
  client_id += 1;
  player_list.push({
    channel_id: channel.id,
    player_id: my_id,
    channel: channel,
  });

  channel.onDisconnect(() => {
    console.log(`${channel.id} disconnected`);
    const i = player_list.findIndex(x => x.player_id === my_id);
    if (i >= 0) {
      player_list.splice(i, 1);
      if (player_list.length === 0) {
        game?.stop();
      }
    }
  });

  // NOTE: temporary start condition
  if (player_list.length === PLAYER_LIMIT) {
    startGame();
  }
});

if ((process.env.NODE_SERVER_TEST ?? '') === '') {
  server.listen(port, () => {
    console.log(`spela spel gratis på http://localhost:${port}`);
  });
}
