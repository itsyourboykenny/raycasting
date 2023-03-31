"use strict";
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
class aStar {
    static checkSpot(origin, target, endP, queue, map, vMap, unit) {
        if (target.y > map.length - 1 || target.y < 0)
            return;
        if (target.x > map[0].length - 1 || target.x < 0)
            return;
        if (map[target.y][target.x] != 0)
            return;
        let temp = new Vertex({ x: target.x, y: target.y }, endP);
        temp.distance = origin.distance + unit;
        temp.f = temp.distance + temp.h;
        temp.prev = origin;
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
