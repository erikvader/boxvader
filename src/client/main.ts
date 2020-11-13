import ClientGame from './game.ts';
import * as PIXI from 'pixi.js';
import pson from '../common/pson.ts';
import geckos from '@geckos.io/client';

PIXI.loader
  .add('imgs/baby_yoda.PNG')
  .add('imgs/zombie_0.png')
  .load(() => {
    const channel = geckos({ port: 3000 });
    const renderer = PIXI.autoDetectRenderer({ width: 512, height: 512 });
    renderer.backgroundColor = 0xffd700;
    document.body.appendChild(renderer.view);
    const stage = new PIXI.Container();

    const game = new ClientGame({
      sendInputFun: x => {
        channel.raw.emit(pson.encode(x).toArrayBuffer());
      },
      renderer,
      stage,
    });

    channel.onConnect(error => {
      if (error) {
        console.error(error.message);
        return;
      }

      channel.onRaw(data => game.serverMsg(pson.decode(data)));

      channel.on('start', data => {
        game.my_id = data['id'];
        game.start().then(() => {
          console.log('game finished');
          // TODO: what to do now?
        });
      });

      channel.onDisconnect(reason => {
        game.stop();
        // TODO: how to make gecko reconnect?
      });

      // channel.onRaw(data => {
      //   const d = pson.decode(data);
      //   if (d['type'] === 'position') {
      //     if (d['player_id'] === my_id) {
      //       player.x = d['x'];
      //       player.y = d['y'];
      //     } else {
      //       const player_to_move = player_list[d['player_id']];
      //       player_to_move.x = d['x'];
      //       player_to_move.y = d['y'];
      //     }
      //   } else if (d['type'] === 'id') {
      //     my_id = d['new_id'];
      //   } else if (d['type'] === 'new_player') {
      //     add_character(d['x'], d['y'], 0.5, 'imgs/zombie_0.png', d['player_id']);
      //   } else if (d['type'] === 'player_disconected') {
      //     app.stage.removeChild(player_list[d['player_id']]);
      //     player_list.splice(d['player_id'], 1);
      //   } else {
      //     console.log(data);
      //     console.log('msg:', d);
      //   }
      // });
      // const d = pson.encode({ hej: 1 }).toArrayBuffer();
      // channel.raw.emit(d);
    });

    // function play(delta) {
    //   if (my_id != null) {
    //     const position_data = pson
    //       .encode({
    //         type: 'position',
    //         player_id: my_id,
    //         x: player.vx + player.x,
    //         y: player.vy + player.y,
    //       })
    //       .toArrayBuffer();
    //     channel.raw.emit(position_data);
    //   }
    // }
  });
