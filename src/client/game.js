import keyboard from './keyboard';
import SpriteUtilities from './spriteUtilities';
import * as PIXI from 'pixi.js';

const movement_speed = 2;
const su = new SpriteUtilities(PIXI);

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

//Aliases
const Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle,
    TextureCache = PIXI.utils.TextureCache,
    MovieClip = PIXI.MovieClip;


//Create a Pixi Application
const app = new Application({width: 512, height: 512});
let player;
let state = play;

//Add the canvas that Pixi automatically created for you to the HTML document

loader
  .add("imgs/baby_yoda.PNG")
  .add("imgs/zombie_0.png")
  .load(setup);

function setup() {

    player = add_character(200, 200, 0.5, "imgs/zombie_0.png")

    app.ticker.add(delta => gameLoop(delta));
    key_presses();
}
function gameLoop(delta){
    state(delta);
}

function add_character(x, y, scale, img_filepath){
    let character = load_zombie(img_filepath)

    character.position.set(x, y);
    character.vx = 0;
    character.vy = 0;
    
    character.scale.set(scale, scale);
    character.anchor.set(0.5, 0.5);
    
    app.stage.addChild(character);

    character.show(character.animationStates.down);
    return character
}

function load_zombie(img_filepath) {
    const frames = su.filmstrip(img_filepath, 128, 128);
    let animation = su.sprite(frames);
    const stripSize = 36;
    const walkOffset = 4;
    const walkAnimationLength = 7;

    animation.fps = 12;
    animation.animationStates = {
        left: 0,
        left_up: stripSize,
        up: stripSize*2,
        up_right: stripSize*3,
        right: stripSize*4,
        right_down: stripSize*5,
        down: stripSize*6,
        left_down:stripSize*7,
        walkLeft: [stripSize * 0 + walkOffset, stripSize * 0 + walkOffset +walkAnimationLength],
        walkLeft_up: [stripSize * 1 + walkOffset, stripSize * 1 + walkOffset +walkAnimationLength],
        walkUp: [stripSize * 2 + walkOffset, stripSize * 2 + walkOffset +walkAnimationLength],
        walkRight_up: [stripSize * 3 + walkOffset, stripSize * 3 + walkOffset +walkAnimationLength],
        walkRight: [stripSize * 4 + walkOffset, stripSize * 4 + walkOffset +walkAnimationLength],
        walkRight_down: [stripSize * 5 + walkOffset, stripSize * 5 + walkOffset +walkAnimationLength],
        walkDown: [stripSize * 6 + walkOffset, stripSize * 6 + walkOffset +walkAnimationLength],
        walkLeft_down: [stripSize * 7 + walkOffset, stripSize * 7 + walkOffset +walkAnimationLength]
    }
    return animation
}

function play(delta){
    player.x += player.vx;
    player.y += player.vy;
  }


function key_presses() {
    //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
    up = keyboard("ArrowUp"),
    right = keyboard("ArrowRight"),
    down = keyboard("ArrowDown");
    
    //Left arrow key `press` method
    left.press = () => {
        if(up.isDown) {
            player.playAnimation(player.animationStates.walkLeft_up)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkLeft_down)
        } else {
            player.playAnimation(player.animationStates.walkLeft)
        }

        player.vx = -movement_speed;
    };

    //Left arrow key `release` method
    left.release = () => {
        if(up.isDown) {
            player.playAnimation(player.animationStates.walkUp)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkDown)
        } else if(right.isDown){
            player.playAnimation(player.animationStates.walkRight)
        } else {
            player.show(player.animationStates.left);
        }

        if (!right.isDown) {
            player.vx = 0;
        }
        else {
            player.vx = movement_speed
        }

    };

    //Up
    up.press = () => {
        if(right.isDown) {
            player.playAnimation(player.animationStates.walkRight_up)
        } else if(left.isDown) {
            player.playAnimation(player.animationStates.walkLeft_up)
        } else {
            player.playAnimation(player.animationStates.walkUp)
        }

        player.vy = -movement_speed;
    };

    up.release = () => {
        if(right.isDown) {
            player.playAnimation(player.animationStates.walkRight)
        } else if(left.isDown) {
            player.playAnimation(player.animationStates.walkLeft)
        } else if(down.isDown){
            player.playAnimation(player.animationStates.walkDown)
        } else {
            player.show(player.animationStates.up);
        }

        if (!down.isDown) {
            player.vy = 0;
        }
        else {
            player.vy = movement_speed;
        }
    };

    //Right
    right.press = () => {
        if(up.isDown) {
            player.playAnimation(player.animationStates.walkRight_up)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkRight_down)
        } else {
            player.playAnimation(player.animationStates.walkRight)
        }

        player.vx = movement_speed;
    };
    right.release = () => {

        if(up.isDown) {
            player.playAnimation(player.animationStates.walkUp)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkDown)
        } else if(left.isDown){
            player.playAnimation(player.animationStates.walkLeft)
        } else {
            player.show(player.animationStates.right);
        }

        if (!left.isDown) {
            player.vx = 0;
        }
        else{
            player.vx = -movement_speed;
        }
    };

    //Down
    down.press = () => {

        if(right.isDown) {
            player.playAnimation(player.animationStates.walkRight)
        } else if(left.isDown) {
            player.playAnimation(player.animationStates.walkLeft)
        } else if(up.isDown){
            player.playAnimation(player.animationStates.walkUp)
        } else {
            player.show(player.animationStates.up);
        }

        player.vy = movement_speed;
    };
    down.release = () => {
        if(right.isDown) {
            player.playAnimation(player.animationStates.walkRight)
        } else if(left.isDown) {
            player.playAnimation(player.animationStates.walkLeft)
        } else if(up.isDown){
            player.playAnimation(player.animationStates.walkUp)
        } else {
            player.show(player.animationStates.down);
        }

        if (!up.isDown) {
            player.vy = 0;
        }
        else{
            player.vy = -movement_speed;
        }
    };
}

export default app;
