class Joystick {
    public id:string;
    public xy: {x:number, y:number};
    private dragStart: {x:number, y:number};
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private touchID: number;
    public maxDistance: number;
    public active: boolean;

    constructor (idName:string, maxDist: number) {
        this.id = idName;
        this.canvas = (document.getElementById(idName) as HTMLCanvasElement);
        this.ctx = (this.canvas.getContext('2d') as CanvasRenderingContext2D);
        this.dragStart = {x:0, y:0};
        this.xy = {x:0, y:0};
        this.touchID = 0;
        this.maxDistance = (this.canvas.offsetWidth as number)/2;
        this.active = false;

        this.canvas.addEventListener('touchstart', this.touchDown.bind(this));
        this.canvas.addEventListener('touchmove', this.touchMove.bind(this));
        window.addEventListener('touchend', this.touchUp.bind(this));

        this.canvas.addEventListener('mousedown', this.touchDown.bind(this));
        this.canvas.addEventListener('mousemove', this.touchMove.bind(this));
        window.addEventListener('mouseup', this.touchUp.bind(this));
    }

    public touchDown(event) {
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
        this.drawPath(this.xy);
    }
    
    public touchUp(event) {
        if ((event instanceof TouchEvent)
            && ((event as TouchEvent).changedTouches[0].identifier != this.touchID))
                return;

        this.active = false;
        this.xy = {x:0, y:0};

        this.ctx.beginPath();
        this.ctx.clearRect(0,0,(this.canvas.offsetWidth as number), (this.canvas.offsetHeight as number));
    }
    
    private minMax(i: number) {
        let temp = Math.min(i, this.maxDistance);
        temp = Math.max(-this.maxDistance, temp);
        return temp;
    }

    public drawPath(change: {x:number, y:number}) {
        let centerX = this.canvas.offsetWidth/2;
        let centerY = this.canvas.offsetHeight/2;

        this.ctx.beginPath();
        this.ctx.clearRect(0,0,(this.canvas.offsetWidth as number), (this.canvas.offsetHeight as number));
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + change.x, centerY + change.y);
        this.ctx.strokeStyle = 'black';
        this.ctx.stroke();
    }
}