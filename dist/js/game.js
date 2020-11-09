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
let baby_yoda;

state = play;
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
  .add("imgs/baby_yoda.PNG")
  .load(setup);

function setup() {
    baby_yoda = new Sprite(
        loader.resources["imgs/baby_yoda.PNG"].texture
    );
    baby_yoda.position.set(50, 96);
    baby_yoda.vx = 0;
    baby_yoda.vy = 0;
    
    baby_yoda.scale.set(0.2, 0.2);
    baby_yoda.anchor.set(0.5, 0.5);
    key_presses();
    app.stage.addChild(baby_yoda);
    app.ticker.add(delta => gameLoop(delta));

}
function gameLoop(delta){
    state(delta);
}

function play(delta){
    //Move the cat 1 pixel 
    baby_yoda.x += baby_yoda.vx;
    baby_yoda.y += baby_yoda.vy;
  }


function key_presses() {
    //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
    up = keyboard("ArrowUp"),
    right = keyboard("ArrowRight"),
    down = keyboard("ArrowDown");

    //Left arrow key `press` method
    left.press = () => {
        //Change the cat's velocity when the key is pressed
        baby_yoda.vx = -5;
        baby_yoda.vy = 0;
    };

    //Left arrow key `release` method
    left.release = () => {
        //If the left arrow has been released, and the right arrow isn't down,
        //and the cat isn't moving vertically:
        //Stop the cat
        if (!right.isDown && baby_yoda.vy === 0) {
            baby_yoda.vx = 0;
        }
    };

    //Up
    up.press = () => {
        baby_yoda.vy = -5;
        baby_yoda.vx = 0;
    };
    up.release = () => {
        if (!down.isDown && baby_yoda.vx === 0) {
        baby_yoda.vy = 0;
        }
    };

    //Right
    right.press = () => {
        baby_yoda.vx = 5;
        baby_yoda.vy = 0;
    };
    right.release = () => {
        if (!left.isDown && baby_yoda.vy === 0) {
            baby_yoda.vx = 0;
        }
    };

    //Down
    down.press = () => {
        baby_yoda.vy = 5;
        baby_yoda.vx = 0;
    };
    down.release = () => {
        if (!up.isDown && baby_yoda.vx === 0) {
            baby_yoda.vy = 0;
        }
    };
}