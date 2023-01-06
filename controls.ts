class Joystick {
    public id:string;
    public xy: {x:number, y:number};
    private dragStart: {x:number, y:number};
    private canvas: HTMLElement | null;
    private touchID: number;
    public maxDistance: number;
    public active: boolean;

    constructor (idName:string, maxDist: number) {
        this.id = idName;
        this.canvas = document.getElementById(idName);
        this.dragStart = {x:0, y:0};
        this.xy = {x:0, y:0};
        this.touchID = 0;
        this.maxDistance = (this.canvas?.offsetWidth as number)/2;
        this.active = false;

        this.canvas?.addEventListener('touchstart', this.touchDown.bind(this));
        this.canvas?.addEventListener('touchmove', this.touchMove.bind(this));
        window.addEventListener('touchend', this.touchUp.bind(this));

        this.canvas?.addEventListener('mousedown', this.touchDown.bind(this));
        this.canvas?.addEventListener('mousemove', this.touchMove.bind(this));
        window.addEventListener('mouseup', this.touchUp.bind(this));
    }

    public touchDown(event) {
        event.preventDefault();
        this.active = true;

        if (event instanceof TouchEvent) {
            this.dragStart.x = event.changedTouches[0].clientX;
            this.dragStart.y = event.changedTouches[0].clientY;
            this.touchID = event.changedTouches[0].identifier;
        }
        else {
            this.dragStart.x = event.clientX;
            this.dragStart.y = event.clientY;
        }

        console.log(`touchDown x:${this.dragStart.x}, y:${this.dragStart.y}`);
    }

    public touchMove(event) {
        if (!this.active) return;

        let dx;
        let dy;

        if (event instanceof TouchEvent) {
            let e = (event as TouchEvent);
            if (e.changedTouches[0].identifier != this.touchID) return;
            dx = e.changedTouches[0].clientX - this.dragStart.x;
            dy = e.changedTouches[0].clientY - this.dragStart.y;
        }
        else {
            let e = (event as MouseEvent);
            dx = e.clientX - this.dragStart.x;
            dy = e.clientY - this.dragStart.y;
        }

        
        this.xy = {x:this.minMax(dx), y:this.minMax(dy)};
        console.log(`touchMove x:${this.xy.x}, y:${this.xy.y}`);
    }
    
    public touchUp(event) {
        this.active = false;
        this.xy = {x:0, y:0};
        console.log(`touchEnd`);
    }
    
    private minMax(i: number) {
        let temp = Math.min(i, this.maxDistance);
        temp = Math.max(-this.maxDistance, temp);
        return temp;
    }
}