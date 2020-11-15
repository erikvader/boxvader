import path from 'path';

import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
const port = 3000;

import geckos from '@geckos.io/server';
const io = geckos();

import PSON from 'pson';
const pson = new PSON.StaticPair(['hej']);

io.addServer(server);

app.use('/', express.static(path.join(__dirname, '../../public')));
app.use('/', express.static(path.join(__dirname, '../../dist')));

type Player = {
  channel_id: string | undefined;
  player_id: number;
  x: number;
  y: number;
};

let client_id = 0;
const player_list: Player[] = [];

io.onConnection(channel => {
  console.log(`${channel.id} connected`);

  const id = pson.encode({ type: 'id', new_id: client_id }).toArrayBuffer();
  channel.raw.emit(id);

  const new_player = pson
    .encode({ type: 'new_player', player_id: client_id })
    .toArrayBuffer();
  channel.raw.broadcast.emit(new_player);
  for (const player of player_list) {
    const new_player = pson
      .encode({
        type: 'new_player',
        player_id: player['player_id'],
        x: player['x'],
        y: player['y'],
      })
      .toArrayBuffer();
    channel.raw.emit(new_player);
  }
  player_list.push({
    channel_id: channel.id,
    player_id: client_id,
    x: 200,
    y: 200,
  });

  client_id += 1;

  channel.onDisconnect(() => {
    for (const player of player_list) {
      if (player.channel_id === channel.id) {
        const player_disconected = pson
          .encode({
            type: 'player_disconected',
            player_id: player['player_id'],
          })
          .toArrayBuffer();
        channel.raw.broadcast.emit(player_disconected);
        player_list.splice(player_list.indexOf(player), 1);
        break;
      }
    }

    console.log(`${channel.id} disconnected`);
  });

  channel.onRaw(data => {
    const json_data = pson.decode(data);

    if (json_data['type'] === 'position') {
      const new_pos = pson
        .encode({
          type: 'position',
          player_id: json_data['player_id'],
          x: json_data['x'],
          y: json_data['y'],
        })
        .toArrayBuffer();
      io.raw.emit(new_pos);
      for (const player of player_list) {
        if (player.player_id === json_data['player_id']) {
          player.x = json_data['x'];
          player.y = json_data['y'];
        }
      }
    } else {
      channel.raw.emit(data);
    }
  });
});

if ((process.env.NODE_SERVER_TEST ?? '') === '') {
  server.listen(port, () => {
    console.log(`spela spel gratis på http://localhost:${port}`);
  });
}
