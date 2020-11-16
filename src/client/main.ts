import ClientGame from './game';
import * as PIXI from 'pixi.js';
import pson from '../common/pson.ts';
import geckos from '@geckos.io/client';

function setup() {
  const channel = geckos({ port: 3000 });
  const renderer = PIXI.autoDetectRenderer({ width: 512, height: 512 });
  renderer.backgroundColor = 0xffd700;
  document.body.appendChild(renderer.view);
  const stage = new PIXI.Container();

  const game = new ClientGame({
    sendInputFun: x => {
      channel.raw.emit(x);
    },
    renderer,
    stage,
  });

  channel.onConnect(error => {
    if (error) {
      console.error(error.message);
      return;
    }

    channel.onRaw(data => game.serverMsg(data));

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
  });
}

PIXI.loader
  .add('imgs/baby_yoda.PNG')
  .add('imgs/zombie_0.png')
  .load(setup);
