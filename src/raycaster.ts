const resolutionX = 640;
const resolutionY = 480;

interface Number {
    mod(a: number): number;
}
Number.prototype.mod = function (n) {
    "use strict";
    return (((this as number) % n) + n) % n;
};

/**
 * Essentially is the player. It holds location information of where the player is currently located
 * The minimap, renderer and pathfinding classes will reference this object for what the player is doing.
 * It will monitor keypress events
 */
class LocationData {
    public coordinateX: number = 0;
    public coordinateY: number = 0;
    public coordinateAngle: number = 0;
    private speedMultiplier: number = 0.15;
    private rotationSpeed: number = 0.05;
    private keyMap = new Map<string, boolean>();
    public worldMap;
    public playerSize: number = 1;
    public fov = 60 * Math.PI / 180;

    constructor(map : number [][]) {
        this.worldMap = map;
        this.coordinateX = this.worldWidth/2;
        this.coordinateY = 2*this.worldHeight/3;
    }

    public get worldWidth() { return this.worldMap[0].length; }
    
    public get worldHeight() { return this.worldMap.length; }
    
    public newMap(map : number [][]) { this.worldMap = map; }

    public attach(): void {
        window.addEventListener('keydown', (event) => {
            this.populateKeymap(event);
        });
        window.addEventListener('keyup', (event) => {
            this.populateKeymap(event);
        });
    }

    public populateKeymap(event : KeyboardEvent) {
        if ((event.code == 'ArrowLeft') ||
            (event.code == 'ArrowRight') ||
            (event.code == 'KeyW') ||
            (event.code == 'KeyS') ||
            (event.code == 'KeyA') ||
            (event.code == 'KeyD')) {
                this.keyMap.set(event.code, (event.type == 'keydown'));
        }
    }

    public update(): void {
        if (this.keyMap.get('ArrowLeft')) this.left();
        if (this.keyMap.get('ArrowRight')) this.right();
        if (this.keyMap.get('KeyW')) this.up();
        if (this.keyMap.get('KeyS')) this.down();
        if (this.keyMap.get('KeyA')) this.strafeLeft();
        if (this.keyMap.get('KeyD')) this.strafeRight();
    }

    public startLogger(): void {
        window.addEventListener('keydown', (event) => {
            console.log(`code: ${event.code}; key: ${event.key}`);
        });
    }

    public stickRotate(endP: Joystick) {
        if (endP.xy.x == 0) return;

        let right = (endP.xy.x >= 0);
        let mult = Math.abs(endP.xy.x / endP.maxDistance);

        if (right) this.right(mult);
        else this.left(mult);
    }

    public moveTo(endP: Joystick) {
        const maxD = endP.maxDistance;
        const right = (endP.xy.x >= 0);
        const up = !(endP.xy.y >= 0);

        // Horizontal
        if (endP.xy.x != 0) {
            let mult = Math.abs(endP.xy.x / endP.maxDistance);
            if (right) this.strafeRight(mult);
            else this.strafeLeft(mult);
        }

        // Vertical
        if (endP.xy.y != 0) {
            let mult = Math.abs(endP.xy.y / endP.maxDistance);
            if (up) this.up(mult);
            else this.down(mult);
        }
    }

    public move(angle: number = this.coordinateAngle, mult: number = this.speedMultiplier): void {
        let xMovement: number = mult * 0.5 * Math.cos(angle);
        let yMovement: number = mult * 0.5 * Math.sin(angle);

        let newX = this.coordinateX + xMovement;
        let newY = this.coordinateY + yMovement;

        if (this.worldMap[this.worldHeight - 1 - Math.floor(this.coordinateY)]
            [Math.floor(newX + this.playerSize/2 * (xMovement>0 ? 1 : -1))]==0)
                this.coordinateX = newX;

        if (this.worldMap[this.worldHeight - 1 - Math.floor(newY + this.playerSize/2 * (yMovement>0 ? 1 : -1))]
            [Math.floor(this.coordinateX)]==0)
                this.coordinateY = newY;
    }

    public up(mult: number = this.speedMultiplier): void {
        this.move(this.coordinateAngle, mult);
    }
    
    public down(mult: number = this.speedMultiplier): void {
        this.move((this.coordinateAngle + Math.PI).mod(2*Math.PI));
    }

    public strafeLeft(mult: number = this.speedMultiplier): void {
        this.move((this.coordinateAngle + Math.PI/2).mod(2*Math.PI));
    }
    
    public strafeRight(mult: number = this.speedMultiplier): void {
        this.move((this.coordinateAngle - Math.PI/2).mod(2*Math.PI));
    }

    public left(mult: number = this.speedMultiplier): void {
        this.coordinateAngle = (this.coordinateAngle+(this.rotationSpeed * mult)).mod(2*Math.PI);
    }
    
    public right(mult: number = this.speedMultiplier): void {
        this.coordinateAngle = (this.coordinateAngle-(this.rotationSpeed * mult)).mod(2*Math.PI);
    }
};

/**
 * Draws the minimap. It uses LocationData object to draw what what the player is doing and looking at
 */
class Minimap {
    public canvas: (HTMLCanvasElement | null);
    public ctx: (CanvasRenderingContext2D | null);
    private data: LocationData;

    /**
     * @param src : id of the canvas to draw the minimap
     * @param theData : LocationData object which holds the player location info
     */
    constructor(src: string, theData: LocationData) {
        this.canvas = document.getElementById(src) as HTMLCanvasElement;
        this.ctx = (this.canvas as HTMLCanvasElement).getContext('2d');
        this.canvas.width = 250;
        this.canvas.height = this.canvas.width * (theData.worldHeight/theData.worldWidth);
        this.data = theData;
    }

    clearScreen(): void {
        if (this.canvas != null && this.ctx != null)
            this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    }

    /**
     * Primary draw method. When in use this one should be called.
     * This calls other method as needed for you program
     * @param input : Array of Rayhit objects to draw from
     */
    draw(input:RayHit[]): void {
        this.drawPlayer();
        this.drawArea(input);
        // this.drawSplines();
    }

    drawPlayer(): void {
        if (this.canvas == null || this.ctx == null)
            return;
        let dotSize = (this.canvas.width / this.data.worldWidth) / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(this.data.coordinateX/this.data.worldWidth*this.canvas.width,
            this.canvas.height - this.data.coordinateY/this.data.worldHeight*this.canvas.height);
        this.ctx.arc(this.data.coordinateX/this.data.worldWidth*this.canvas.width,
            this.canvas.height - this.data.coordinateY/this.data.worldHeight*this.canvas.height,
            dotSize, 0, 2*Math.PI);
        this.ctx.fillStyle = 'Black';
        this.ctx.fill();
    }

    drawAngle(angle: number): void {
        if (this.canvas == null || this.ctx == null)
            return;

        this.ctx.beginPath();
        this.ctx.moveTo(this.data.coordinateX/this.data.worldWidth*this.canvas.width,
            this.canvas.height - this.data.coordinateY/this.data.worldHeight*this.canvas.height);
        let endpoint = RayCaster.castSingleRay(this.data.coordinateX,
            this.data.coordinateY, angle, this.data.worldMap);
        this.ctx.lineTo((endpoint.x/this.data.worldWidth * this.canvas.width),
            (this.canvas.height - endpoint.y/this.data.worldHeight * this.canvas.height));

        this.ctx.strokeStyle = 'Red';
        this.ctx.stroke();
    }

    /**
     * Draws a solid cone which is the player's field of view
     * @param input : Array of Rayhit objects to draw from
     * @returns 
     */
    drawArea(input: RayHit[]): void {
        if (this.canvas == null || this.ctx == null)
            return;
        this.ctx.beginPath();
        this.ctx.moveTo(this.data.coordinateX/this.data.worldWidth*this.canvas.width,
            this.canvas.height - this.data.coordinateY/this.data.worldHeight*this.canvas.height);

        input.forEach((endpoint) => {
            if (this.canvas != null && this.ctx != null)
                this.ctx.lineTo(endpoint.x/this.data.worldWidth * this.canvas.width, this.canvas.height - endpoint.y/this.data.worldHeight * this.canvas.height);
        });

        this.ctx.moveTo(this.data.coordinateX/this.data.worldWidth*this.canvas.width,
            this.canvas.height - this.data.coordinateY/this.data.worldHeight*this.canvas.height);
        this.ctx.fillStyle = 'Red';
        this.ctx.fill();
    }

    drawSplines(): void {
        for (let x=this.data.coordinateAngle-this.data.fov/2; x<this.data.coordinateAngle+this.data.fov/2; x+=Math.PI/256){
            this.drawAngle(x.mod(2*Math.PI));
        }
    }

    drawMap(map: number [][]): void {
        for (let y=0; y<this.data.worldHeight; y++) {
            for (let x=0; x<this.data.worldWidth; x++) {
                if (map[y][x] > 0) {
                    if (this.canvas == null || this.ctx == null)
                        continue;
                    let currPosX = x/(this.data.worldWidth);
                    let currPosY = y/(this.data.worldHeight);
                    this.ctx.beginPath();
                    this.ctx.moveTo((currPosX * this.canvas.width), (currPosY * this.canvas.height));
                    this.ctx.rect((currPosX * this.canvas.width), (currPosY*this.canvas.height), (this.canvas.width / map[0].length), (this.canvas.height / map.length));
                    this.ctx.fillStyle = 'Black';
                    this.ctx.fill();
                }
            }
        }
    }

    /**
     * Draws a line path from the given array of x,y coordinates
     * @param path : Array of {x,y} to draw points
     */
    public drawPath(path: {x:number,y:number}[]) {
        if (this.canvas == null || this.ctx == null)
            return;

        let height = this.data.worldHeight - 1;
        let width = this.data.worldWidth - 1;

        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x/width * this.canvas.offsetWidth, path[0].y/height * this.canvas.offsetHeight);
        path.forEach((point) => {
            if (this.canvas != null && this.ctx != null)
                this.ctx.lineTo(point.x/width * this.canvas.offsetWidth, point.y/height * this.canvas.offsetHeight);
        });
        this.ctx.strokeStyle = 'Blue';
        this.ctx.stroke();
    }
};

/**
 * The class that renders the actual game into a canvas by it's id
 */
class Renderer {
    private canvas: (HTMLCanvasElement | null);
    private ctx: (CanvasRenderingContext2D | null);
    private client: HTMLElement = document.getElementById("gameContainer") as HTMLElement;
    private minWallHeight;
    private maxWallHeight;
    private playerHeight;
    private maxDistance = 32;
    private projectionDist:number = 16;
    private wallHeight:number = 64;

    /**
     * @param src : id of the canvas to draw the game
     * @param map : 2d array of ints that is the map
     */
    constructor(src: string, map: number[][]) {
        this.canvas = document.getElementById(src) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = this.client.clientWidth;
        this.canvas.height = this.client.clientHeight;

        this.minWallHeight = 0;
        this.maxWallHeight = this.canvas.height;
        this.playerHeight = 0.1 * this.canvas.height;
    }

    /**
     * Draws vetical lines (y resolution) times of canvas from left to right using data from an array of RayHits
     * @param input : Array of Rayhit objects
     */
    public draw(input:RayHit[]) {
        if (this.canvas == null || this.ctx == null)
            return;
        
            this.canvas.width = this.client.clientWidth;
            this.canvas.height = this.client.clientWidth * (3/4);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let count:number = 0;

        while(count < input.length) {
            let currWall:boolean = input[count].horizontal;
            this.ctx.beginPath();
            while(count<input.length && input[count].horizontal == currWall) {
                let pixelWallHeight = this.wallHeight/input[count].correctDist * this.projectionDist;
                this.ctx.moveTo(count, this.canvas.height - this.canvas.height*0.5 + pixelWallHeight/2);
                this.ctx.lineTo(count, this.canvas.height - this.canvas.height*0.5 - pixelWallHeight/2);
                count++;
            }
            this.ctx.strokeStyle = currWall ? 'Black' : 'Grey';
            this.ctx.stroke();
        }
    }
};

/**
 * Data struct that hold information about the where the ray hit
 * correctDist is the orthagonal distance between the player and the wall hit.
 */
class RayHit {
    constructor(
        public x:number,
        public y:number,
        public distance:number,
        public correctDist:number,
        public horizontal: boolean
    ){}
}

/**
 * The raycaster engine used in the original Wolfenstein game, but written using JavaScript
 */
class RayCaster {
    public static tan(angle: number) {
        if ((angle>Math.PI/2 && angle<Math.PI) ||
            (angle>3*Math.PI/2 && angle < 2*Math.PI)) return -Math.tan(angle);
        return Math.tan(angle);
    }

    public static checkCell(posX:number, posY:number, map: number[][]): boolean {
        if(posX>map[0].length-1 || posX<0 || posY>map.length-1 || posY<0) return false;
        let checkY = map.length - 1 - Math.floor(posY);
        let checkX = Math.floor(posX);
        if (map[checkY][checkX] > 0) return true;
        return false;
    }

    /**
     * Casts a single ray from where the player is and returns the first cell it has hit
     * @param posX : Players x position
     * @param posY : Players y position
     * @param angle : Angle at which the player is looking
     * @param map : 2d array of ints that is the map
     * @returns : x,y cell which the ray has hit
     */
    public static castSingleRay(posX: number, posY: number, angle: number, map: number[][]) {
        let dx: number = 0;
        let dy: number = 0;
        let vy: number = 0;
        let vx: number = 0;
        let stepX: number = 0;
        let stepY: number = 0;
        let right: boolean;
        let up: boolean;
        let output: RayHit[] = [];

        right = (angle>=0 && angle<=Math.PI/2) || (angle>=3*Math.PI/2 && angle<2*Math.PI);
        up = (angle>=0 && angle<=Math.PI);
        
        // Calculate dx and X steps
        vx = (posY%1 == 0) ? 1
            : (up) ? Math.ceil(posY)-posY
            : posY - Math.floor(posY);
        dx = vx / this.tan(angle);
        stepX = 1 / this.tan(angle);


        // Calculate dy and Y steps
        vy = (posX%1 == 0) ? 1
            : (right) ? Math.ceil(posX) - posX
            : posX - Math.floor(posX);
        dy = vy * this.tan(angle);
        stepY = 1 * this.tan(angle);

        // Flip arithmetic
        let dirX = right ? 1 : -1;
        let dirY = up ? 1 : -1;

        // Check horizontal walls
        let toCheckY = Math.round(posY + vx*dirY);
        let toCheckX = posX + (dx * dirX);

        while (toCheckY>=0 && toCheckY<map.length && toCheckX>=0 && toCheckX<map[0].length) {
            if (this.checkCell(toCheckX, toCheckY - (up ? 0 : 1), map)) {
                let hypotenuse = (toCheckX - posX)/Math.cos(angle);
                let _dx = toCheckX - posX;
                let _dy = toCheckY - posY;
                let correctDist = _dx * Math.cos(angle) + _dy * Math.sin(angle);
                output.push(new RayHit(toCheckX, toCheckY, hypotenuse, correctDist, true));
                break;
            }
            else {
                toCheckX += (stepX * dirX);
                toCheckY += (1 * dirY);
            }
        }

        // Check vertical walls
        toCheckX = Math.round(posX + (vy * dirX));
        toCheckY = posY + (dy * dirY);

        while (toCheckY>=0 && toCheckY<map.length && toCheckX>=0 && toCheckX<map[0].length) {
            if (this.checkCell(toCheckX - (right ? 0 : 1), toCheckY, map)) {
                let hypotenuse = (toCheckX - posX)/Math.cos(angle);
                let _dx = toCheckX - posX;
                let _dy = toCheckY - posY;
                let correctDist = _dx * Math.cos(angle) + _dy * Math.sin(angle);
                output.push(new RayHit(toCheckX, toCheckY, hypotenuse, correctDist, false));
                break;
            }
            else {
                toCheckY += (stepY * dirY);
                toCheckX += (1 * dirX);
            }
        }

        // If both vertical and horizontal collision is detected return the shorter one
        if (output.length>1 && (output[0].distance > output[1].distance))
            return output[1];

        return output[0];
    }

    public static castArea(posX: number, posY: number, angle: number, fovInRads: number, resolution: number, map: number[][]): RayHit[] {
        let rayHits: RayHit[] = [];
        for(let x=angle+fovInRads/2; x>=angle-fovInRads/2; x-=fovInRads/resolution) {
            let peek = this.castSingleRay(posX, posY, x.mod(2*Math.PI), map);
            // let phi = x - angle;
            // peek.correctDist = peek.distance * Math.cos(phi.mod(2*Math.PI));
            rayHits.push(peek);
        }
        return rayHits;
    }
}