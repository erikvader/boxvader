
let movement_speed = 2; 
let su = new SpriteUtilities(PIXI);
let textureArrayLeftWalk = [];

let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

//Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle,
    TextureCache = PIXI.utils.TextureCache,
    MovieClip = PIXI.MovieClip;


//Create a Pixi Application
let app = new Application({width: 512, height: 512});
let player;
let zombie;
state = play;
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
  .add("imgs/baby_yoda.PNG")
  .add("imgs/zombie_0.png")
  .load(setup);

function setup() {

    player = add_characther(200, 200, "imgs/zombie_0.png")

    //let base = TextureCache["imgs/zombie_0.png"];
    /*
    for (let i = 0; i < 8; i++) {
        textureArrayLeftWalk[i] = new PIXI.Texture(base);
        textureArrayLeftWalk[i].frame = new Rectangle((4 + i )*128, 0, 128, 128);
    }
    let animation = new MovieClip(textureArrayLeftWalk);
    animation.position.set(20, 20)
    app.stage.addChild(animation);
    animation.play();
    animation.animationSpeed = 0.2;
    */
    //player = add_characther(50, 50, "imgs/zombie_0.png")

    app.ticker.add(delta => gameLoop(delta));
    key_presses();
}
function gameLoop(delta){
    state(delta);
}

function add_characther(x, y, img_filepath){
    characther = load_animation(img_filepath)


    characther.position.set(x, y);
    characther.vx = 0;
    characther.vy = 0;
    
    characther.scale.set(0.5, 0.5);
    characther.anchor.set(0.5, 0.5);
    
    app.stage.addChild(characther);

    characther.show(characther.animationStates.down);
    return characther
}

function load_animation(img_filepath) {
    let frames = su.filmstrip(img_filepath, 128, 128);
    zombie = su.sprite(frames);
    let stripSize = 36;
    let walkOffset = 4;
    let walkAnimationLength = 7;

    zombie.fps = 12;
    zombie.animationStates = {
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
    
    return zombie
}

function play(delta){
    //Move the player 1 pixel 
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
        
        if(up.isDown) {
            player.playAnimation(player.animationStates.walkLeft_up)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkLeft_down)
        } else {
            player.playAnimation(player.animationStates.walkLeft)
        }
        player.vx = -movement_speed;
        //player.vy = 0;
    };

    //Left arrow key `release` method
    left.release = () => {
        //If the left arrow has been released, and the right arrow isn't down,
        //and the sprite isn't moving vertically:
        //Stop the sprite
        if(up.isDown) {
            player.playAnimation(player.animationStates.walkUp)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkDown)
        } else if(right.isDown){
            player.playAnimation(player.animationStates.walkRight)
        } else {
            player.show(characther.animationStates.left);
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
        //player.vx = 0;
    };
    up.release = () => {
        if(right.isDown) {
            player.playAnimation(player.animationStates.walkRight)
        } else if(left.isDown) {
            player.playAnimation(player.animationStates.walkLeft)
        } else if(down.isDown){
            player.playAnimation(player.animationStates.walkDown)
        } else {
            player.show(characther.animationStates.up);
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
        //player.vy = 0;
    };
    right.release = () => {

        if(up.isDown) {
            player.playAnimation(player.animationStates.walkUp)
        } else if(down.isDown) {
            player.playAnimation(player.animationStates.walkDown)
        } else if(left.isDown){
            player.playAnimation(player.animationStates.walkLeft)
        } else {
            player.show(characther.animationStates.right);
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
            player.show(characther.animationStates.up);
        }

        player.vy = movement_speed;
        //player.vx = 0;
    };
    down.release = () => {
        if(right.isDown) {
            player.playAnimation(player.animationStates.walkRight)
        } else if(left.isDown) {
            player.playAnimation(player.animationStates.walkLeft)
        } else if(up.isDown){
            player.playAnimation(player.animationStates.walkUp)
        } else {
            player.show(characther.animationStates.down);
        }

        if (!up.isDown) {
            player.vy = 0;
        }
        else{
            player.vy = -movement_speed;
        }
    };
}