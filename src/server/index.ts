import path from 'path';

import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
const port = 3000;

import { default as geckos, ServerChannel } from '@geckos.io/server';
const io = geckos();

import pson from '../common/pson';
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

io.onConnection(channel => {
  console.log(`${channel.id} connected`);
  channel.onDrop(drop => {
    console.warn(`We are dropping packets: ${drop}`);
  });

  // const new_player = pson
  //   .encode({ type: 'new_player', player_id: client_id })
  //   .toArrayBuffer();

  // channel.raw.broadcast.emit(new_player);
  // for (const player of player_list) {
  //   const new_player = pson
  //     .encode({
  //       type: 'new_player',
  //       player_id: player['player_id'],
  //       x: player['x'],
  //       y: player['y'],
  //     })
  //     .toArrayBuffer();
  //   channel.raw.emit(new_player);
  // }

  player_list.push({
    channel_id: channel.id,
    player_id: client_id,
    channel: channel,
  });
  client_id += 1;

  // NOTE: temporary start condition
  if (player_list.length === 2) {
    game = new ServerGame(
      // TODO: check if the emitted object is too big
      x => io.raw.room().emit(pson.encode(x).toArrayBuffer()),
      Array.from(player_list.map(p => p.player_id)),
    );

    for (const p of player_list) {
      p.channel.emit('start', { id: p.player_id }, { reliable: true });
      p.channel.onRaw(data => game?.clientMsg(p.player_id, pson.decode(data)));
    }

    game.start().then(() => console.log('game done'));
  }

  // channel.onDisconnect(() => {
  //   for (const player of player_list) {
  //     if (player['channel_id'] === channel.id) {
  //       const player_disconected = pson
  //         .encode({
  //           type: 'player_disconected',
  //           player_id: player['player_id'],
  //         })
  //         .toArrayBuffer();
  //       channel.raw.broadcast.emit(player_disconected);
  //       player_list.splice(player_list.indexOf(player), 1);

  //       break;
  //     }
  //   }

  //   console.log(`${channel.id} disconnected`);
  // });

  // channel.onRaw(data => {
  //   const json_data = pson.decode(data);

  //   if (json_data['type'] === 'position') {
  //     const new_pos = pson
  //       .encode({
  //         type: 'position',
  //         player_id: json_data['player_id'],
  //         x: json_data['x'],
  //         y: json_data['y'],
  //       })
  //       .toArrayBuffer();
  //     io.raw.emit(new_pos);
  //     for (const player of player_list) {
  //       if (player['player_id'] === json_data['player_id']) {
  //         player['x'] = json_data['x'];
  //         player['y'] = json_data['y'];
  //       }
  //     }
  //   } else {
  //     channel.raw.emit(data);
  //   }
  // });
});

server.listen(port, () => {
  console.log(`spela spel gratis på http://localhost:${port}`);
});
