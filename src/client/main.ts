import ClientGame from './game';
import * as PIXI from 'pixi.js';
import geckos from '@geckos.io/client';
import {
  PLAYER_SPRITE,
  PORT,
  MAP_SIZE_X,
  MAP_SIZE_Y,
  CLIENT_UPS,
  CLIENT_FPS,
} from '../common/constants';

function setup() {
  const channel = geckos({ port: PORT });
  const renderer = PIXI.autoDetectRenderer({
    width: MAP_SIZE_X,
    height: MAP_SIZE_Y,
  });
  renderer.backgroundColor = 0xffd700;
  document.body.appendChild(renderer.view);
  const stage = new PIXI.Container();

  const game = new ClientGame({
    sendInputFun: x => {
      channel.raw.emit(x);
    },
    renderer,
    ups: CLIENT_UPS,
    fps: CLIENT_FPS,
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

    /* eslint-disable @typescript-eslint/no-unused-vars */
    channel.onDisconnect(reason => {
      game.stop();
      // TODO: how to make gecko reconnect?
    });
  });
}

PIXI.loader
  .add(PLAYER_SPRITE)
  .add('imgs/tilesheets/scifitiles-sheet.png')
  .load(setup);
