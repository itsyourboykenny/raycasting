/**
 * Data struct used for storing vertex information. This will be in a priority queue used
 * by a* to determine the shortest path between you and the enemy
 */
class Vertex {
    /**
     * x: X position in map
     * y: Y position in map
     * h: Heuristic distance. Linear distance from this node to the goal
     * f: Travel distance to this node + Heuristic distance
     */
    public x: number;
    public y: number;
    public prev: Vertex|null = null;
    public distance: number = 0;
    public h: number;
    public f: number;
    public visited: boolean = false;
    public nodeLen = 1;
    public diagLen = Math.SQRT2;

    constructor(start: {x:number, y:number}, end:{x:number, y:number}){
        let dx = Math.abs(start.x - end.x);
        let dy = Math.abs(start.y - end.y);
        this.h = this.f = this.nodeLen * (dx + dy) + (this.diagLen - 2 * this.nodeLen) * Math.min(dx, dy);
        
        this.x = start.x;
        this.y = start.y;
    }

    public copy(source: Vertex) {
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
    private list: Vertex[] = [];

    public top(): Vertex|null{
        if (this.list.length<1) return null;
        return this.list[this.list.length-1];
    }

    public sort() {
        this.list.sort((a: Vertex, b: Vertex) => {
            return b.f - a.f;
        });
    }

    public push(point: Vertex): void {
        this.list.push(point);
        this.sort();
    }

    public pop(): Vertex {
        let temp = this.list[this.list.length-1];
        this.list.pop();
        return temp;
    }

    public isEmpty() {
        return !(this.list.length > 0);
    }
}

/**
 * This class stores the 2d array of Vertex objects
 */
class VertexMap {
    public map: (Vertex | null) [][];

    constructor(worldMap: number[][]) {
        this.map = [];
        for(let i=0; i<worldMap.length; i++) {
            this.map[i] = [];
            for (let j=0; j<worldMap[i].length; j++) {
                this.map[i][j] = null;
            }
        }
    }

    public push(x:number, y:number, item: Vertex): boolean {
        if (this.map[y][x] != null) return false;
        
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
    static checkSpot(origin: Vertex, target:{x:number,y:number}, endP: {x:number, y:number}, queue: PQ, map: number[][], vMap: VertexMap, unit:number) {
        if(target.y>map.length-1 || target.y<0) return;
        if(target.x>map[0].length-1 || target.x<0) return;
        if(map[target.y][target.x] != 0) return;

        // Calculate heuristic and travel distance
        let temp = new Vertex({x:target.x,y:target.y}, endP);
        temp.distance = origin.distance + unit;
        temp.f = temp.distance + temp.h;
        temp.prev = origin;
        
        // Update if a shorter path is discovered
        if(vMap.map[target.y][target.x] instanceof Vertex
            && !(vMap.map[target.y][target.x] as Vertex).visited
            && (vMap.map[target.y][target.x] as Vertex).f > temp.f) {

            (vMap.map[target.y][target.x] as Vertex).copy(temp);
            queue.sort();
        }
        else if(!vMap.map[target.y][target.x]) {
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
    static checkAdj(origin: Vertex, endP: {x:number, y:number}, queue: PQ, map: number[][], vMap: VertexMap) {
        origin.visited = true;

        // Top
        let x = origin.x;
        let y = origin.y - 1;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.nodeLen);

        // Top Right
        x = origin.x + 1;
        y = origin.y - 1;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.diagLen);

        // Right
        x = origin.x+1;
        y = origin.y;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.nodeLen);

        // Bottom Right
        x = origin.x + 1;
        y = origin.y + 1;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.diagLen);

        // Bottom
        x = origin.x;
        y = origin.y+1;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.nodeLen);

        // Bottom Left
        x = origin.x - 1;
        y = origin.y + 1;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.diagLen);

        // Left
        x = origin.x - 1;
        y = origin.y;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.nodeLen);

        // Top Left
        x = origin.x - 1;
        y = origin.y - 1;
        this.checkSpot(origin,{x:x,y:y},endP,queue,map,vMap,origin.diagLen);
    }

    /**
     * Runs the A* algorithm
     * @param start : x,y location of the starting point
     * @param end : x,y location of the ending point
     * @param map : 2d array of ints that is the map
     * @returns: An array of x,y coordinates
     */
    static explore(start: {x:number, y:number}, end: {x:number, y:number}, map: number[][]): {x:number,y:number}[] {
        let vMap = new VertexMap(map);
        let queue = new PQ();
        let origin = new Vertex(start,end);
        vMap.push(start.x, start.y, origin);
        this.checkAdj(origin, end, queue, map, vMap);

        let curr: Vertex = origin;
        while(!queue.isEmpty()) {
            curr = (queue.pop() as Vertex);
            if (curr.x == end.x && curr.y == end.y) break;
            this.checkAdj(curr, end, queue, map, vMap);
        }

        let path: {x:number,y:number}[] = [];

        while(curr.prev != null) {
            path.push({x:curr.x, y:curr.y});
            curr = (curr.prev as Vertex);
        }

        return path.reverse();
    }
}