"use strict";
/**
 * This class handles drawing the joystick to the screen. Takes the id of the div tag
 * as parameter and it's max travel distance in pixels. xy object can be monitored by
 * other classes to determine its movement
 */
class Joystick {
    constructor(idName, maxDist) {
        this.id = idName;
        this.canvas = document.getElementById(idName);
        this.ctx = this.canvas.getContext('2d');
        this.dragStart = { x: 0, y: 0 };
        this.xy = { x: 0, y: 0 };
        this.touchID = 0;
        this.maxDistance = this.canvas.offsetWidth / 2;
        this.active = false;
        this.canvas.addEventListener('touchstart', this.touchDown.bind(this));
        this.canvas.addEventListener('touchmove', this.touchMove.bind(this));
        window.addEventListener('touchend', this.touchUp.bind(this));
        this.canvas.addEventListener('mousedown', this.touchDown.bind(this));
        this.canvas.addEventListener('mousemove', this.touchMove.bind(this));
        window.addEventListener('mouseup', this.touchUp.bind(this));
    }
    /**
     * Monitors both touch and mouse down event.
     * Triggers the start of a drag movement
     *
     * @param event: eventhandler object
     */
    touchDown(event) {
        event.preventDefault();
        this.active = true;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        if (event instanceof TouchEvent) {
            this.dragStart.x = event.changedTouches[0].clientX;
            this.dragStart.y = event.changedTouches[0].clientY;
            this.touchID = event.changedTouches[0].identifier;
        }
        else {
            this.dragStart.x = event.clientX;
            this.dragStart.y = event.clientY;
        }
    }
    /**
     * Monitors when the mouse/touch has moves across the screen
     * @param event: eventhandler object
     */
    touchMove(event) {
        if (!this.active)
            return;
        let dx;
        let dy;
        if (event instanceof TouchEvent) {
            let e = event;
            if (e.changedTouches[0].identifier != this.touchID)
                return;
            dx = e.changedTouches[0].clientX - this.dragStart.x;
            dy = e.changedTouches[0].clientY - this.dragStart.y;
        }
        else {
            let e = event;
            dx = e.clientX - this.dragStart.x;
            dy = e.clientY - this.dragStart.y;
        }
        this.xy = { x: this.minMax(dx), y: this.minMax(dy) };
        this.drawPath(this.xy);
    }
    /**
     * Monitors when touch/mouse click has been cancelled
     * @param event: eventhandler object
     */
    touchUp(event) {
        if ((event instanceof TouchEvent)
            && (event.changedTouches[0].identifier != this.touchID))
            return;
        this.active = false;
        this.xy = { x: 0, y: 0 };
        this.ctx.beginPath();
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    }
    /**
     * Limits joystick input to +maxDistance/-maxDistance
     * @param i: Vector length of the movement of joystick from center of screen
     */
    minMax(i) {
        let temp = Math.min(i, this.maxDistance);
        temp = Math.max(-this.maxDistance, temp);
        return temp;
    }
    /**
     * Draws an arrow in the joystick div from center
     * @param change: the x y coordinate of where the joystick currently is
     */
    drawPath(change) {
        let centerX = this.canvas.offsetWidth / 2;
        let centerY = this.canvas.offsetHeight / 2;
        this.ctx.beginPath();
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
        this.ctx.arc(centerX + this.xy.x, centerY + this.xy.y, this.canvas.width * 0.1, 0, 2 * Math.PI);
        this.ctx.fillStyle = "black";
        this.ctx.fill();
    }
}
/**
 * Data struct used for storing vertex information. This will be in a priority queue used
 * by a* to determine the shortest path between you and the enemy
 */
class Vertex {
    constructor(start, end) {
        this.prev = null;
        this.distance = 0;
        this.visited = false;
        this.nodeLen = 1;
        this.diagLen = Math.SQRT2;
        let dx = Math.abs(start.x - end.x);
        let dy = Math.abs(start.y - end.y);
        this.h = this.f = this.nodeLen * (dx + dy) + (this.diagLen - 2 * this.nodeLen) * Math.min(dx, dy);
        this.x = start.x;
        this.y = start.y;
    }
    copy(source) {
        this.x = source.x;
        this.y = source.y;
        this.prev = source.prev;
        this.distance = source.distance;
        this.h = source.h;
        this.f = source.f;
        this.visited = source.visited;
    }
}
/**
 * Priority Queue used for A* algorithm
 */
class PQ {
    constructor() {
        this.list = [];
    }
    top() {
        if (this.list.length < 1)
            return null;
        return this.list[this.list.length - 1];
    }
    sort() {
        this.list.sort((a, b) => {
            return b.f - a.f;
        });
    }
    push(point) {
        this.list.push(point);
        this.sort();
    }
    pop() {
        let temp = this.list[this.list.length - 1];
        this.list.pop();
        return temp;
    }
    isEmpty() {
        return !(this.list.length > 0);
    }
}
/**
 * This class stores the 2d array of Vertex objects
 */
class VertexMap {
    constructor(worldMap) {
        this.map = [];
        for (let i = 0; i < worldMap.length; i++) {
            this.map[i] = [];
            for (let j = 0; j < worldMap[i].length; j++) {
                this.map[i][j] = null;
            }
        }
    }
    push(x, y, item) {
        if (this.map[y][x] != null)
            return false;
        this.map[y][x] = item;
        return true;
    }
}
/**
 * A* path finding algorithm
 */
class aStar {
    /**
     * Visits a single node from a given point, to another. Determined by parameters origin and target
     * @param origin : Vertex of the the node it came from
     * @param target : Ending vertex location
     * @param endP : xy coordinate of where the goal is
     * @param queue : The prioritoy queue to track most promising nodes
     * @param map : The 2d array of ints that is the game map
     * @param vMap : 2d array of vertices that corresponds to map
     * @param unit : The distance cost from origin to target
     */
    static checkSpot(origin, target, endP, queue, map, vMap, unit) {
        if (target.y > map.length - 1 || target.y < 0)
            return;
        if (target.x > map[0].length - 1 || target.x < 0)
            return;
        if (map[target.y][target.x] != 0)
            return;
        // Calculate heuristic and travel distance
        let temp = new Vertex({ x: target.x, y: target.y }, endP);
        temp.distance = origin.distance + unit;
        temp.f = temp.distance + temp.h;
        temp.prev = origin;
        // Update if a shorter path is discovered
        if (vMap.map[target.y][target.x] instanceof Vertex
            && !vMap.map[target.y][target.x].visited
            && vMap.map[target.y][target.x].f > temp.f) {
            vMap.map[target.y][target.x].copy(temp);
            queue.sort();
        }
        else if (!vMap.map[target.y][target.x]) {
            vMap.push(target.x, target.y, temp);
            queue.push(temp);
        }
    }
    /**
     * Calls checkSpot() on all adjacent vertices. x,y and diagonal
     * @param origin : Vertex of the the node it came from
     * @param endP : X Y location of the goal
     * @param queue : The prioritoy queue to track most promising nodes
     * @param map : 2d array of ints that is the map
     * @param vMap : 2d array of vertices that mirrors the map
     */
    static checkAdj(origin, endP, queue, map, vMap) {
        origin.visited = true;
        // Top
        let x = origin.x;
        let y = origin.y - 1;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.nodeLen);
        // Top Right
        x = origin.x + 1;
        y = origin.y - 1;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.diagLen);
        // Right
        x = origin.x + 1;
        y = origin.y;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.nodeLen);
        // Bottom Right
        x = origin.x + 1;
        y = origin.y + 1;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.diagLen);
        // Bottom
        x = origin.x;
        y = origin.y + 1;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.nodeLen);
        // Bottom Left
        x = origin.x - 1;
        y = origin.y + 1;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.diagLen);
        // Left
        x = origin.x - 1;
        y = origin.y;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.nodeLen);
        // Top Left
        x = origin.x - 1;
        y = origin.y - 1;
        this.checkSpot(origin, { x: x, y: y }, endP, queue, map, vMap, origin.diagLen);
    }
    /**
     * Runs the A* algorithm
     * @param start : x,y location of the starting point
     * @param end : x,y location of the ending point
     * @param map : 2d array of ints that is the map
     * @returns: An array of x,y coordinates
     */
    static explore(start, end, map) {
        let vMap = new VertexMap(map);
        let queue = new PQ();
        let origin = new Vertex(start, end);
        vMap.push(start.x, start.y, origin);
        this.checkAdj(origin, end, queue, map, vMap);
        let curr = origin;
        while (!queue.isEmpty()) {
            curr = queue.pop();
            if (curr.x == end.x && curr.y == end.y)
                break;
            this.checkAdj(curr, end, queue, map, vMap);
        }
        let path = [];
        while (curr.prev != null) {
            path.push({ x: curr.x, y: curr.y });
            curr = curr.prev;
        }
        return path.reverse();
    }
}
const resolutionX = 640;
const resolutionY = 480;
Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
};
/**
 * Essentially is the player. It holds location information of where the player is currently located
 * The minimap, renderer and pathfinding classes will reference this object for what the player is doing.
 * It will monitor keypress events
 */
class LocationData {
    constructor(map) {
        this.coordinateX = 0;
        this.coordinateY = 0;
        this.coordinateAngle = 0;
        this.speedMultiplier = 0.15;
        this.rotationSpeed = 0.05;
        this.keyMap = new Map();
        this.playerSize = 1;
        this.fov = 60 * Math.PI / 180;
        this.worldMap = map;
        this.coordinateX = this.worldWidth / 2;
        this.coordinateY = 2 * this.worldHeight / 3;
    }
    get worldWidth() { return this.worldMap[0].length; }
    get worldHeight() { return this.worldMap.length; }
    newMap(map) { this.worldMap = map; }
    attach() {
        window.addEventListener('keydown', (event) => {
            this.populateKeymap(event);
        });
        window.addEventListener('keyup', (event) => {
            this.populateKeymap(event);
        });
    }
    populateKeymap(event) {
        if ((event.code == 'ArrowLeft') ||
            (event.code == 'ArrowRight') ||
            (event.code == 'KeyW') ||
            (event.code == 'KeyS') ||
            (event.code == 'KeyA') ||
            (event.code == 'KeyD')) {
            this.keyMap.set(event.code, (event.type == 'keydown'));
        }
    }
    update() {
        if (this.keyMap.get('ArrowLeft'))
            this.left();
        if (this.keyMap.get('ArrowRight'))
            this.right();
        if (this.keyMap.get('KeyW'))
            this.up();
        if (this.keyMap.get('KeyS'))
            this.down();
        if (this.keyMap.get('KeyA'))
            this.strafeLeft();
        if (this.keyMap.get('KeyD'))
            this.strafeRight();
    }
    startLogger() {
        window.addEventListener('keydown', (event) => {
            console.log(`code: ${event.code}; key: ${event.key}`);
        });
    }
    stickRotate(endP) {
        if (endP.xy.x == 0)
            return;
        let right = (endP.xy.x >= 0);
        let mult = Math.abs(endP.xy.x / endP.maxDistance);
        if (right)
            this.right(mult);
        else
            this.left(mult);
    }
    moveTo(endP) {
        const maxD = endP.maxDistance;
        const right = (endP.xy.x >= 0);
        const up = !(endP.xy.y >= 0);
        // Horizontal
        if (endP.xy.x != 0) {
            let mult = Math.abs(endP.xy.x / endP.maxDistance);
            if (right)
                this.strafeRight(mult);
            else
                this.strafeLeft(mult);
        }
        // Vertical
        if (endP.xy.y != 0) {
            let mult = Math.abs(endP.xy.y / endP.maxDistance);
            if (up)
                this.up(mult);
            else
                this.down(mult);
        }
    }
    move(angle = this.coordinateAngle, mult = this.speedMultiplier) {
        let xMovement = mult * 0.5 * Math.cos(angle);
        let yMovement = mult * 0.5 * Math.sin(angle);
        let newX = this.coordinateX + xMovement;
        let newY = this.coordinateY + yMovement;
        if (this.worldMap[this.worldHeight - 1 - Math.floor(this.coordinateY)][Math.floor(newX + this.playerSize / 2 * (xMovement > 0 ? 1 : -1))] == 0)
            this.coordinateX = newX;
        if (this.worldMap[this.worldHeight - 1 - Math.floor(newY + this.playerSize / 2 * (yMovement > 0 ? 1 : -1))][Math.floor(this.coordinateX)] == 0)
            this.coordinateY = newY;
    }
    up(mult = this.speedMultiplier) {
        this.move(this.coordinateAngle, mult);
    }
    down(mult = this.speedMultiplier) {
        this.move((this.coordinateAngle + Math.PI).mod(2 * Math.PI));
    }
    strafeLeft(mult = this.speedMultiplier) {
        this.move((this.coordinateAngle + Math.PI / 2).mod(2 * Math.PI));
    }
    strafeRight(mult = this.speedMultiplier) {
        this.move((this.coordinateAngle - Math.PI / 2).mod(2 * Math.PI));
    }
    left(mult = this.speedMultiplier) {
        this.coordinateAngle = (this.coordinateAngle + (this.rotationSpeed * mult)).mod(2 * Math.PI);
    }
    right(mult = this.speedMultiplier) {
        this.coordinateAngle = (this.coordinateAngle - (this.rotationSpeed * mult)).mod(2 * Math.PI);
    }
}
;
/**
 * Draws the minimap. It uses LocationData object to draw what what the player is doing and looking at
 */
class Minimap {
    /**
     * @param src : id of the canvas to draw the minimap
     * @param theData : LocationData object which holds the player location info
     */
    constructor(src, theData) {
        this.canvas = document.getElementById(src);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 250;
        this.canvas.height = this.canvas.width * (theData.worldHeight / theData.worldWidth);
        this.data = theData;
    }
    clearScreen() {
        if (this.canvas != null && this.ctx != null)
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * Primary draw method. When in use this one should be called.
     * This calls other method as needed for you program
     * @param input : Array of Rayhit objects to draw from
     */
    draw(input) {
        this.drawPlayer();
        this.drawArea(input);
        // this.drawSplines();
    }
    drawPlayer() {
        if (this.canvas == null || this.ctx == null)
            return;
        let dotSize = (this.canvas.width / this.data.worldWidth) / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.data.coordinateX / this.data.worldWidth * this.canvas.width, this.canvas.height - this.data.coordinateY / this.data.worldHeight * this.canvas.height);
        this.ctx.arc(this.data.coordinateX / this.data.worldWidth * this.canvas.width, this.canvas.height - this.data.coordinateY / this.data.worldHeight * this.canvas.height, dotSize, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'Black';
        this.ctx.fill();
    }
    drawAngle(angle) {
        if (this.canvas == null || this.ctx == null)
            return;
        this.ctx.beginPath();
        this.ctx.moveTo(this.data.coordinateX / this.data.worldWidth * this.canvas.width, this.canvas.height - this.data.coordinateY / this.data.worldHeight * this.canvas.height);
        let endpoint = RayCaster.castSingleRay(this.data.coordinateX, this.data.coordinateY, angle, this.data.worldMap);
        this.ctx.lineTo((endpoint.x / this.data.worldWidth * this.canvas.width), (this.canvas.height - endpoint.y / this.data.worldHeight * this.canvas.height));
        this.ctx.strokeStyle = 'Red';
        this.ctx.stroke();
    }
    /**
     * Draws a solid cone which is the player's field of view
     * @param input : Array of Rayhit objects to draw from
     * @returns
     */
    drawArea(input) {
        if (this.canvas == null || this.ctx == null)
            return;
        this.ctx.beginPath();
        this.ctx.moveTo(this.data.coordinateX / this.data.worldWidth * this.canvas.width, this.canvas.height - this.data.coordinateY / this.data.worldHeight * this.canvas.height);
        input.forEach((endpoint) => {
            if (this.canvas != null && this.ctx != null)
                this.ctx.lineTo(endpoint.x / this.data.worldWidth * this.canvas.width, this.canvas.height - endpoint.y / this.data.worldHeight * this.canvas.height);
        });
        this.ctx.moveTo(this.data.coordinateX / this.data.worldWidth * this.canvas.width, this.canvas.height - this.data.coordinateY / this.data.worldHeight * this.canvas.height);
        this.ctx.fillStyle = 'Red';
        this.ctx.fill();
    }
    drawSplines() {
        for (let x = this.data.coordinateAngle - this.data.fov / 2; x < this.data.coordinateAngle + this.data.fov / 2; x += Math.PI / 256) {
            this.drawAngle(x.mod(2 * Math.PI));
        }
    }
    drawMap(map) {
        for (let y = 0; y < this.data.worldHeight; y++) {
            for (let x = 0; x < this.data.worldWidth; x++) {
                if (map[y][x] > 0) {
                    if (this.canvas == null || this.ctx == null)
                        continue;
                    let currPosX = x / (this.data.worldWidth);
                    let currPosY = y / (this.data.worldHeight);
                    this.ctx.beginPath();
                    this.ctx.moveTo((currPosX * this.canvas.width), (currPosY * this.canvas.height));
                    this.ctx.rect((currPosX * this.canvas.width), (currPosY * this.canvas.height), (this.canvas.width / map[0].length), (this.canvas.height / map.length));
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
    drawPath(path) {
        if (this.canvas == null || this.ctx == null)
            return;
        let height = this.data.worldHeight - 1;
        let width = this.data.worldWidth - 1;
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x / width * this.canvas.offsetWidth, path[0].y / height * this.canvas.offsetHeight);
        path.forEach((point) => {
            if (this.canvas != null && this.ctx != null)
                this.ctx.lineTo(point.x / width * this.canvas.offsetWidth, point.y / height * this.canvas.offsetHeight);
        });
        this.ctx.strokeStyle = 'Blue';
        this.ctx.stroke();
    }
}
;
/**
 * The class that renders the actual game into a canvas by it's id
 */
class Renderer {
    /**
     * @param src : id of the canvas to draw the game
     * @param map : 2d array of ints that is the map
     */
    constructor(src, map) {
        this.client = document.getElementById("gameContainer");
        this.maxDistance = 32;
        this.projectionDist = 16;
        this.wallHeight = 64;
        this.canvas = document.getElementById(src);
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
    draw(input) {
        if (this.canvas == null || this.ctx == null)
            return;
        this.canvas.width = this.client.clientWidth;
        this.canvas.height = this.client.clientWidth * (3 / 4);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let count = 0;
        while (count < input.length) {
            let currWall = input[count].horizontal;
            this.ctx.beginPath();
            while (count < input.length && input[count].horizontal == currWall) {
                let pixelWallHeight = this.wallHeight / input[count].correctDist * this.projectionDist;
                this.ctx.moveTo(count, this.canvas.height - this.canvas.height * 0.5 + pixelWallHeight / 2);
                this.ctx.lineTo(count, this.canvas.height - this.canvas.height * 0.5 - pixelWallHeight / 2);
                count++;
            }
            this.ctx.strokeStyle = currWall ? 'Black' : 'Grey';
            this.ctx.stroke();
        }
    }
}
;
/**
 * Data struct that hold information about the where the ray hit
 * correctDist is the orthagonal distance between the player and the wall hit.
 */
class RayHit {
    constructor(x, y, distance, correctDist, horizontal) {
        this.x = x;
        this.y = y;
        this.distance = distance;
        this.correctDist = correctDist;
        this.horizontal = horizontal;
    }
}
/**
 * The raycaster engine used in the original Wolfenstein game, but written using JavaScript
 */
class RayCaster {
    static tan(angle) {
        if ((angle > Math.PI / 2 && angle < Math.PI) ||
            (angle > 3 * Math.PI / 2 && angle < 2 * Math.PI))
            return -Math.tan(angle);
        return Math.tan(angle);
    }
    static checkCell(posX, posY, map) {
        if (posX > map[0].length - 1 || posX < 0 || posY > map.length - 1 || posY < 0)
            return false;
        let checkY = map.length - 1 - Math.floor(posY);
        let checkX = Math.floor(posX);
        if (map[checkY][checkX] > 0)
            return true;
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
    static castSingleRay(posX, posY, angle, map) {
        let dx = 0;
        let dy = 0;
        let vy = 0;
        let vx = 0;
        let stepX = 0;
        let stepY = 0;
        let right;
        let up;
        let output = [];
        right = (angle >= 0 && angle <= Math.PI / 2) || (angle >= 3 * Math.PI / 2 && angle < 2 * Math.PI);
        up = (angle >= 0 && angle <= Math.PI);
        // Calculate dx and X steps
        vx = (posY % 1 == 0) ? 1
            : (up) ? Math.ceil(posY) - posY
                : posY - Math.floor(posY);
        dx = vx / this.tan(angle);
        stepX = 1 / this.tan(angle);
        // Calculate dy and Y steps
        vy = (posX % 1 == 0) ? 1
            : (right) ? Math.ceil(posX) - posX
                : posX - Math.floor(posX);
        dy = vy * this.tan(angle);
        stepY = 1 * this.tan(angle);
        // Flip arithmetic
        let dirX = right ? 1 : -1;
        let dirY = up ? 1 : -1;
        // Check horizontal walls
        let toCheckY = Math.round(posY + vx * dirY);
        let toCheckX = posX + (dx * dirX);
        while (toCheckY >= 0 && toCheckY < map.length && toCheckX >= 0 && toCheckX < map[0].length) {
            if (this.checkCell(toCheckX, toCheckY - (up ? 0 : 1), map)) {
                let hypotenuse = (toCheckX - posX) / Math.cos(angle);
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
        while (toCheckY >= 0 && toCheckY < map.length && toCheckX >= 0 && toCheckX < map[0].length) {
            if (this.checkCell(toCheckX - (right ? 0 : 1), toCheckY, map)) {
                let hypotenuse = (toCheckX - posX) / Math.cos(angle);
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
        if (output.length > 1 && (output[0].distance > output[1].distance))
            return output[1];
        return output[0];
    }
    static castArea(posX, posY, angle, fovInRads, resolution, map) {
        let rayHits = [];
        for (let x = angle + fovInRads / 2; x >= angle - fovInRads / 2; x -= fovInRads / resolution) {
            let peek = this.castSingleRay(posX, posY, x.mod(2 * Math.PI), map);
            // let phi = x - angle;
            // peek.correctDist = peek.distance * Math.cos(phi.mod(2*Math.PI));
            rayHits.push(peek);
        }
        return rayHits;
    }
}
