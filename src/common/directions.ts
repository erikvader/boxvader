export enum Directions{
    Up = "UP",
    Up_right = "UP_RIGHT",
    Up_left = "UP_LEFT",
    Down = "DOWN",
    Down_right = "DOWN_RIGHT",
    Down_left = "DOWN_LEFT",
    Left = "LEFT",
    Right = "RIGHT",
    Still = "STILL"
}

export function directionToVelocity(dir: Directions): [number, number] {
    switch (dir) {
        case Directions.Up:
            return [0, -1];
            break;
        case Directions.Up_right:
            return [1, -1];
            break;
        case Directions.Up_left:
            return [-1, -1];
            break;    
        case Directions.Down:
            return [0, 1];
            break;
        case Directions.Down_right:
            return [1, 1];
            break;
        case Directions.Down_left:
            return [-1, 1];
            break;
        case Directions.Left:
            return [-1, 0];
            break;
        case Directions.Right:
            return [1, 0];
            break;
        case Directions.Still:
            return [0, 0];
    }
    
}

export function decideDirection(up: boolean, down: boolean, right: boolean, left: boolean): Directions {
    if(up){
      if(right){
        return Directions.Up_right
      }
      if(left){
        return Directions.Up_left
      }
      else{
        return Directions.Up
      }
    }
    if(down){
      if(right){
        return Directions.Down_right
      }
      if(left){
        return Directions.Down_left
      }
      else{
        return Directions.Down
      }
    }
    if(right){
      return Directions.Right
    }
    if(left){
      return Directions.Left
    }
    return Directions.Still
  }