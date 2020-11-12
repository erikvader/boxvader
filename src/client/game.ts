import Key from './key.ts';
import SpriteUtilities from './spriteUtilities';
import * as PIXI from 'pixi.js';
import geckos from '@geckos.io/client';
import PSON from 'pson';

type Player = {
  player_id: number;
  player: any;
};

const movement_speed = 2;
const su = new SpriteUtilities(PIXI);
let my_id;
const player_list: Player[] = [];
////CONNECT TO SERVER/////
const pson = new PSON.StaticPair(['hej']);
const channel = geckos({ port: 3000 });
channel.onConnect(error => {
  if (error) {
    console.error(error.message);
    return;
  }
  channel.onRaw(data => {
    const d = pson.decode(data);
    if (d['type'] === 'position') {
      if (d['player_id'] === my_id) {
        player.x = d['x'];
        player.y = d['y'];
      } else {
        for (const player of player_list) {
          if (player.player_id === d['player_id']) {
            const player_to_move = player.player;
            break;
          }
        }
        player_to_move.x = d['x'];
        player_to_move.y = d['y'];
      }
    } else if (d['type'] === 'id') {
      my_id = d['new_id'];
    } else if (d['type'] === 'new_player') {
      add_character(d['x'], d['y'], 0.5, 'imgs/zombie_0.png', d['player_id']);
    } else if (d['type'] === 'player_disconected') {
      for (const player of player_list) {
        if (player.player_id === d['player_id']) {
          app.stage.removeChild(player.player);
          player_list.splice(player_list.indexOf(player), 1);
        }
      }
    } else {
      console.log(data);
      console.log('msg:', d);
    }
  });
  const d = pson.encode({ hej: 1 }).toArrayBuffer();
  channel.raw.emit(d);
});
////////////////////////

//Aliases
const Application = PIXI.Application,
  loader = PIXI.loader;

//Create a Pixi Application
const app = new Application({ width: 512, height: 512 });
app.renderer.backgroundColor = 0xffd700;
let player;
const state = play;

//Add the canvas that Pixi automatically created for you to the HTML document

loader
  .add('imgs/baby_yoda.PNG')
  .add('imgs/zombie_0.png')
  .load(setup);

function setup() {
  player = add_character(200, 200, 0.5, 'imgs/zombie_0.png', my_id);

  app.ticker.add(delta => gameLoop(delta));
  key_presses();
}
function gameLoop(delta) {
  state(delta);
}

function add_character(x, y, scale, img_filepath, id) {
  const character = load_zombie(img_filepath);

  character.position.set(x, y);
  character.vx = 0;
  character.vy = 0;
  character.id = id;
  character.scale.set(scale, scale);
  character.anchor.set(0.5, 0.5);
  player_list.push({ player: character, player_id: id });
  app.stage.addChild(character);

  character.show(character.animationStates.down);

  return character;
}

function load_zombie(img_filepath) {
  const frames = su.filmstrip(img_filepath, 128, 128);
  const animation = su.sprite(frames);
  const stripSize = 36;
  const walkOffset = 4;
  const walkAnimationLength = 7;

  animation.fps = 12;
  animation.animationStates = {
    left: 0,
    left_up: stripSize,
    up: stripSize * 2,
    up_right: stripSize * 3,
    right: stripSize * 4,
    right_down: stripSize * 5,
    down: stripSize * 6,
    left_down: stripSize * 7,
    walkLeft: [
      stripSize * 0 + walkOffset,
      stripSize * 0 + walkOffset + walkAnimationLength,
    ],
    walkLeft_up: [
      stripSize * 1 + walkOffset,
      stripSize * 1 + walkOffset + walkAnimationLength,
    ],
    walkUp: [
      stripSize * 2 + walkOffset,
      stripSize * 2 + walkOffset + walkAnimationLength,
    ],
    walkRight_up: [
      stripSize * 3 + walkOffset,
      stripSize * 3 + walkOffset + walkAnimationLength,
    ],
    walkRight: [
      stripSize * 4 + walkOffset,
      stripSize * 4 + walkOffset + walkAnimationLength,
    ],
    walkRight_down: [
      stripSize * 5 + walkOffset,
      stripSize * 5 + walkOffset + walkAnimationLength,
    ],
    walkDown: [
      stripSize * 6 + walkOffset,
      stripSize * 6 + walkOffset + walkAnimationLength,
    ],
    walkLeft_down: [
      stripSize * 7 + walkOffset,
      stripSize * 7 + walkOffset + walkAnimationLength,
    ],
  };
  return animation;
}

function play(delta) {
  if (my_id != null) {
    const position_data = pson
      .encode({
        type: 'position',
        player_id: my_id,
        x: player.vx + player.x,
        y: player.vy + player.y,
      })
      .toArrayBuffer();
    channel.raw.emit(position_data);
  }
}

function key_presses() {
  //Capture the keyboard arrow keys
  const left = new Key('ArrowLeft');
  const up = new Key('ArrowUp');
  const right = new Key('ArrowRight');
  const down = new Key('ArrowDown');

  //Left arrow key `press` method
  left.press = () => {
    if (up.isDown) {
      player.playAnimation(player.animationStates.walkLeft_up);
    } else if (down.isDown) {
      player.playAnimation(player.animationStates.walkLeft_down);
    } else {
      player.playAnimation(player.animationStates.walkLeft);
    }

    player.vx = -movement_speed;
  };

  //Left arrow key `release` method
  left.release = () => {
    if (up.isDown) {
      player.playAnimation(player.animationStates.walkUp);
    } else if (down.isDown) {
      player.playAnimation(player.animationStates.walkDown);
    } else if (right.isDown) {
      player.playAnimation(player.animationStates.walkRight);
    } else {
      player.show(player.animationStates.left);
    }

    if (!right.isDown) {
      player.vx = 0;
    } else {
      player.vx = movement_speed;
    }
  };

  //Up
  up.press = () => {
    if (right.isDown) {
      player.playAnimation(player.animationStates.walkRight_up);
    } else if (left.isDown) {
      player.playAnimation(player.animationStates.walkLeft_up);
    } else {
      player.playAnimation(player.animationStates.walkUp);
    }

    player.vy = -movement_speed;
  };

  up.release = () => {
    if (right.isDown) {
      player.playAnimation(player.animationStates.walkRight);
    } else if (left.isDown) {
      player.playAnimation(player.animationStates.walkLeft);
    } else if (down.isDown) {
      player.playAnimation(player.animationStates.walkDown);
    } else {
      player.show(player.animationStates.up);
    }

    if (!down.isDown) {
      player.vy = 0;
    } else {
      player.vy = movement_speed;
    }
  };

  //Right
  right.press = () => {
    if (up.isDown) {
      player.playAnimation(player.animationStates.walkRight_up);
    } else if (down.isDown) {
      player.playAnimation(player.animationStates.walkRight_down);
    } else {
      player.playAnimation(player.animationStates.walkRight);
    }

    player.vx = movement_speed;
  };
  right.release = () => {
    if (up.isDown) {
      player.playAnimation(player.animationStates.walkUp);
    } else if (down.isDown) {
      player.playAnimation(player.animationStates.walkDown);
    } else if (left.isDown) {
      player.playAnimation(player.animationStates.walkLeft);
    } else {
      player.show(player.animationStates.right);
    }

    if (!left.isDown) {
      player.vx = 0;
    } else {
      player.vx = -movement_speed;
    }
  };

  //Down
  down.press = () => {
    if (right.isDown) {
      player.playAnimation(player.animationStates.walkRight);
    } else if (left.isDown) {
      player.playAnimation(player.animationStates.walkLeft);
    } else if (up.isDown) {
      player.playAnimation(player.animationStates.walkUp);
    } else {
      player.show(player.animationStates.up);
    }

    player.vy = movement_speed;
  };
  down.release = () => {
    if (right.isDown) {
      player.playAnimation(player.animationStates.walkRight);
    } else if (left.isDown) {
      player.playAnimation(player.animationStates.walkLeft);
    } else if (up.isDown) {
      player.playAnimation(player.animationStates.walkUp);
    } else {
      player.show(player.animationStates.down);
    }

    if (!up.isDown) {
      player.vy = 0;
    } else {
      player.vy = -movement_speed;
    }
  };
}

export default app;
