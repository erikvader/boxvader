import ClientGame from './game';
import * as PIXI from 'pixi.js';
import geckos from '@geckos.io/client';
import {
  PLAYER_SPRITE,
  ENEMY_SPRITE,
  PORT,
  MAP_WIDTH,
  MAP_HEIGHT,
  CLIENT_UPS,
  CLIENT_FPS,
} from '../common/constants';

function setup(): void {
  const channel = geckos({ port: PORT });
  const renderer = PIXI.autoDetectRenderer({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  });
  renderer.backgroundColor = 0xffd700;
  document.body.appendChild(renderer.view);
  const stage = new PIXI.Container();

  const { maxMessageSize } = channel;
  const game = new ClientGame({
    sendInputFun: x => {
      if (maxMessageSize !== undefined && x.byteLength > maxMessageSize) {
        console.warn(
          `Message probably too big! ${x.byteLength} > ${maxMessageSize}`,
        );
      }
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
        console.info('game finished');
        // TODO: what to do now?
      });
    });

    channel.onDisconnect(_reason => {
      game.stop();
      // TODO: how to make gecko reconnect?
    });
  });
}
PIXI.loader
  .add(PLAYER_SPRITE)
  .add(ENEMY_SPRITE)
  .add('imgs/tilesheets/scifitiles-sheet.png')
  .load(setup);
