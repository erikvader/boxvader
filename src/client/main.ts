import ClientGame from './game';
import * as PIXI from 'pixi.js';
import 'pixi-sound';
import geckos from '@geckos.io/client';
import * as constants from '../common/constants';
import GameMap from '../common/gameMap';

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
  const channel = geckos({ port: constants.SERVER.PORT });

  const app = new PIXI.Application();
  const renderer = app.renderer;
  const stage = app.stage;

  document.getElementById('game-container')!.append(renderer.view);
  renderer.backgroundColor = 0xffd700;
  renderer.view.id = 'game';

  const { maxMessageSize } = channel;
  let game;
  let readyStatus = false;

  window.addEventListener('beforeunload', () => {
    channel.close();
  });

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
        ups: constants.CLIENT.UPS,
        fps: constants.CLIENT.FPS,
        stage,
        map,
        my_id: data['id'],
      });

      game.start().then(() => {
        console.info('game finished');
      });
    });

    channel.onDisconnect(() => {
      console.info('Disconnected from the server');
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

PIXI.Loader.shared
  .add(constants.UI.PLAYER_SPRITE_PATH)
  .add(constants.UI.ENEMY_SPRITE_PATH)
  .add('imgs/tilesheets/scifitiles-sheet.png') // TODO: load from map somehow
  .add('dubstep', 'sound/bensound-dubstep.mp3')
  .add('pew', 'sound/pew.mp3')
  .add('die', 'sound/baby_yoda_die.mp3')
  .load(finishedResources);
