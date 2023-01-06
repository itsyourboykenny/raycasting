class Joystick {
    constructor(idName, maxDist) {
        var _a, _b, _c, _d, _e;
        this.id = idName;
        this.canvas = document.getElementById(idName);
        this.dragStart = { x: 0, y: 0 };
        this.xy = { x: 0, y: 0 };
        this.touchID = 0;
        this.maxDistance = ((_a = this.canvas) === null || _a === void 0 ? void 0 : _a.offsetWidth) / 2;
        this.active = false;
        (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.addEventListener('touchstart', this.touchDown.bind(this));
        (_c = this.canvas) === null || _c === void 0 ? void 0 : _c.addEventListener('touchmove', this.touchMove.bind(this));
        window.addEventListener('touchend', this.touchUp.bind(this));
        (_d = this.canvas) === null || _d === void 0 ? void 0 : _d.addEventListener('mousedown', this.touchDown.bind(this));
        (_e = this.canvas) === null || _e === void 0 ? void 0 : _e.addEventListener('mousemove', this.touchMove.bind(this));
        window.addEventListener('mouseup', this.touchUp.bind(this));
    }
    touchDown(event) {
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
        console.log(`touchMove x:${this.xy.x}, y:${this.xy.y}`);
    }
    touchUp(event) {
        this.active = false;
        this.xy = { x: 0, y: 0 };
        console.log(`touchEnd`);
    }
    minMax(i) {
        let temp = Math.min(i, this.maxDistance);
        temp = Math.max(-this.maxDistance, temp);
        return temp;
    }
}
