const SPEED = 8;

cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.sessionId = 0;
        this.isLocal = false;
    },

    setPlayerLab(str) {
        let lab = cc.find("lab", this.node);
        let labScript = lab.getComponent(cc.Label);
        labScript.string = str;
    },

    updateInput(cmd) {
        // this.input.dir.x = cmd.dir.x;
        // this.input.dir.y = cmd.dir.y;
        let dir = cmd.dir;
        if (dir == null) {
            dir = cmd;
        }
        let l_x = this.node.position.x;
        let l_y = this.node.position.y;
        l_x += SPEED * dir.x;
        l_y += SPEED * dir.y;

        if (dir.x != 0 || dir.y != 0) {
            console.log("接收 -------------------------------------   ", dir)
        }
        this.node.position = cc.v2(l_x, l_y)
    }
});
