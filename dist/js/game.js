
let movement_speed = 5; 

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

//Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;


//Create a Pixi Application
let app = new Application({width: 512, height: 512});
let player;

state = play;
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
  .add("imgs/baby_yoda.PNG")
  .load(setup);

function setup() {
    player = add_characther(50, 50, "imgs/baby_yoda.PNG")

    app.ticker.add(delta => gameLoop(delta));
    key_presses();
}
function gameLoop(delta){
    state(delta);
}

function add_characther(x, y, img_filepath){
    characther = new Sprite(
        loader.resources[img_filepath].texture
    );
    characther.position.set(x, y);
    characther.vx = 0;
    characther.vy = 0;
    
    characther.scale.set(0.2, 0.2);
    characther.anchor.set(0.5, 0.5);
    
    app.stage.addChild(characther);
    return characther
}

function play(delta){
    //Move the cat 1 pixel 
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
        //Change the sprites's velocity when the key is pressed
        player.vx = -movement_speed;
        player.vy = 0;
    };

    //Left arrow key `release` method
    left.release = () => {
        //If the left arrow has been released, and the right arrow isn't down,
        //and the sprite isn't moving vertically:
        //Stop the sprite
        if (!right.isDown && player.vy === 0) {
            player.vx = 0;
        }
    };

    //Up
    up.press = () => {
        player.vy = -movement_speed;
        player.vx = 0;
    };
    up.release = () => {
        if (!down.isDown && player.vx === 0) {
        player.vy = 0;
        }
    };

    //Right
    right.press = () => {
        player.vx = movement_speed;
        player.vy = 0;
    };
    right.release = () => {
        if (!left.isDown && player.vy === 0) {
            player.vx = 0;
        }
    };

    //Down
    down.press = () => {
        player.vy = movement_speed;
        player.vx = 0;
    };
    down.release = () => {
        if (!up.isDown && player.vx === 0) {
            player.vy = 0;
        }
    };
}