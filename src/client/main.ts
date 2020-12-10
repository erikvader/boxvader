import ClientGame from './game';
import * as PIXI from 'pixi.js';
import geckos from '@geckos.io/client';
import {
  PLAYER_SPRITE,
  ENEMY_SPRITE,
  PORT,
  CLIENT_UPS,
  CLIENT_FPS,
} from '../common/constants';
import GameMap from '../common/gameMap';
window.PIXI = PIXI;
import 'pixi-layers';

function onDocumentReady(callback: () => void): void {
  // https://codetonics.com/javascript/detect-document-ready/
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

function finishedResources(): void {
  const channel = geckos({ port: PORT });
  const renderer = PIXI.autoDetectRenderer();
  const stage = new PIXI.display.Stage();

  document.getElementById('game-container')!.append(renderer.view);
  renderer.backgroundColor = 0xffd700;
  renderer.view.id = 'game';

  const { maxMessageSize } = channel;
  let game;
  let readyStatus = false;

  channel.onConnect(error => {
    if (error) {
      console.error(error.message);
      return;
    }

    channel.onRaw(data => game?.serverMsg(data));

    channel.on('start', data => {
      const button = document.getElementById('btn-ready');
      if (button !== null) {
        button.remove();
      }

      const map = new GameMap(data['map'], data['tileset']);
      const [
        maps_total_pixel_width,
        maps_total_pixel_height,
      ] = map.total_pixel_size();
      renderer.resize(maps_total_pixel_width, maps_total_pixel_height);

      game = new ClientGame({
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
        map,
        my_id: data['id'],
      });

      game.start().then(() => {
        console.info('game finished');
      });
    });

    channel.onDisconnect(_reason => {
      game?.stop();
    });

    onDocumentReady(() => {
      const button = document.getElementById('btn-ready');
      if (button !== null) {
        button.addEventListener('click', () => {
          if (game !== undefined) return;
          readyStatus = !readyStatus;
          button.innerText = ':-' + (readyStatus ? ')' : '(');
          channel.emit('ready', { status: readyStatus }, { reliable: true });
        });
      }
    });
  });
}

const loader = new PIXI.Loader();
loader
  .add(PLAYER_SPRITE)
  .add(ENEMY_SPRITE)
  .add('imgs/tilesheets/scifitiles-sheet.png') // TODO: load from map somehow
  .load(finishedResources);
