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
PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;

function startGame(
  previousScores?: { name: PIXI.Text; score: PIXI.Text }[],
): void {
  const channel = geckos({ port: constants.SERVER.PORT });

  const renderer = PIXI.autoDetectRenderer();
  const stage = new PIXI.Container();

  document.getElementById('game-container')!.append(renderer.view);
  renderer.backgroundColor = 0xffd700;
  renderer.view.id = 'game';

  const { maxMessageSize } = channel;
  let game;
  let readyStatus = false;
  let playerNames = {};

  window.addEventListener('beforeunload', () => {
    channel.close();
  });

  const marginLeft = 10;
  const gap = marginLeft + 120;
  const offsetDistance = 24;

  if (previousScores) {
    stage.addChild(new PIXI.Text('NAME')).position.set(marginLeft, 0);
    stage.addChild(new PIXI.Text('SCORE')).position.set(gap, 0);
    let offset = 1;
    for (const previousScore of previousScores) {
      stage.addChild(previousScore.name);
      previousScore.name.position.set(marginLeft, offset * offsetDistance);
      stage.addChild(previousScore.score);
      previousScore.score.position.set(gap, offset * offsetDistance);
      offset += 1;
    }
    renderer.render(stage);
  }

  channel.onConnect(error => {
    if (error) {
      console.error(error.message);
      return;
    }

    channel.onRaw(data => game?.serverMsg(data));

    channel.on('start', data => {
      const button = document.getElementById('btn-ready');
      if (button !== null) {
        button.hidden = true;
      }

      playerNames = data['names'];

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
        seed: data['random_seed'],
      });

      game.start().then(() => {
        console.info('game finished');
      });
    });

    channel.on('game_over', data => {
      game?.stop();
      game = undefined;
      channel.close();
      document.getElementById('game')?.remove();

      const button = document.getElementById('btn-ready');
      if (button !== null) {
        button.innerText = ':-(';
        button.hidden = false;
      }
      const scores: { name: PIXI.Text; score: PIXI.Text }[] = [];
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 20,
      });

      const players = data['players'];
      for (const p of players) {
        const name = new PIXI.Text(playerNames[p.id], style);
        const score = new PIXI.Text('' + p.score, style);
        scores.push({ name, score });
      }

      startGame(scores);
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
          channel.emit(
            'ready',
            { status: readyStatus, name: 'Borgov uwu' },
            { reliable: true },
          );
        });
      }
    });
  });
}

PIXI.Loader.shared
  .add(constants.UI.PLAYER_SPRITE_PATH)
  .add(constants.UI.ENEMY_SPRITE_PATH)
  .add('imgs/tilesheets/scifitiles-sheet.png') // TODO: load from map somehow
  .add('imgs/blood/splatter1.png')
  .add('imgs/blood/splatter2.png')
  .add('imgs/blood/splatter3.png')
  .add('pew', 'sound/pew.mp3')
  .add('die', 'sound/baby_yoda_die.mp3')
  .add('huh', 'sound/huh.mp3')
  .load(() => startGame());
