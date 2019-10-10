cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            this.onTouchMove(event);
        }, this);

        this.inputDirectionLocal = cc.v2(0, 0);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    onTouchMove(event) {
        let x = event.getLocationX();
        let y = event.getLocationY();

        console.log("mouse  move  ", x, y);
    },


    onKeyDown(e) {
        // console.log("key   down ==================", e)
        switch (e.keyCode) {
            case cc.KEY.w:
                this.upPressed = true;
                this.inputDirectionLocal.y = this.downPressed ? 0 : 1;
                break;
            case cc.KEY.s:
                this.downPressed = true;
                this.inputDirectionLocal.y = this.upPressed ? 0 : -1;
                break;
            case cc.KEY.a:
                this.leftPressed = true;
                this.inputDirectionLocal.x = this.rightPressed ? 0 : -1;
                break;
            case cc.KEY.d:
                this.rightPressed = true;
                this.inputDirectionLocal.x = this.leftPressed ? 0 : 1;
                break;
            default:
                break;
        }

    },

    onKeyUp(e) {
        // console.log("key   up ==================")
        switch (e.keyCode) {
            case cc.KEY.w:
                this.upPressed = false;
                this.inputDirectionLocal.y = this.downPressed ? -1 : 0;
                break;
            case cc.KEY.s:
                this.downPressed = false;
                this.inputDirectionLocal.y = this.upPressed ? 1 : 0;
                break;
            case cc.KEY.a:
                this.leftPressed = false;
                this.inputDirectionLocal.x = this.rightPressed ? 1 : 0;
                break;
            case cc.KEY.d:
                this.rightPressed = false;
                this.inputDirectionLocal.x = this.leftPressed ? -1 : 0;
                break;
            default:
                break;
        }
    },


    //传给服务器的操作指令
    toServerData() {
        return {
            // mlb: this.mouseLeftButtonDown,
            // mrb: this.mouseRightButtonDown,
            dir: this.inputDirectionLocal
            // mpos: this.mousePosition
        };
    },

});
