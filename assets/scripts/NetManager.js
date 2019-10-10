/*
 * @Author: delevin.ying 
 * @Date: 2019-10-09 14:26:47 
 * @Last Modified by: delevin.ying
 * @Last Modified time: 2019-10-10 13:35:30
 */
const Colyseus = require("colyseus");
const MouseInput = require("MouseInput");
const PlayerController = require("PlayerController");
cc.Class({
    extends: cc.Component,

    properties: {
        playerPrefab: cc.Prefab,
    },

    onLoad() {
        //配置
        this.room_name = "game";
        this.server_url = 'ws://localhost:2567';
        this.serverFrameAcc = 3;
        //服务器帧率
        this.serverFrameRate = 20;
        //随机种子
        this.seed = 51;
        this.readyToControl = false;
        this.loopInterval = 0;
        //当前帧编号
        this.frame_index = 0;
        //本地缓存帧
        this.frames = [];
        this.frame_inv = 0;

        //玩家列表
        this.players = [];

        //玩家的输入
        let canvas = cc.find("Canvas");
        this.mouseInput = canvas.getComponent(MouseInput);
        //加入房间
        this.onJoinRoom();
    },

    //加入房间
    onJoinRoom() {
        this.client = new Colyseus.Client(this.server_url);
        this.client.joinOrCreate(this.room_name, {/* options */ }).then(room => {
            console.log("joined successfully", room);
            this.room = room;
            this.joinSuccess();
        }).catch(e => {
            console.log("join error:\n", e);
        });
        console.log("连接 服务器  2567----", this.client);
    },

    //成功加入房间
    joinSuccess() {
        console.log('成功加入房间------', this.room.id, this.room.sessionId);
        // let player = cc.instantiate(this.playerPrefab);
        // player.parent = cc.find("Canvas/gameWorld");
        // player.position = cc.v2(0, 0);
        // let PlayerScript = player.getComponent(PlayerController);
        // PlayerScript.sessionId = this.room.sessionId;
        // PlayerScript.isLocal = true;
        // PlayerScript.setPlayerLab('玩家： ' + this.room.sessionId);
        // this.players.push(player);
        //服务器广播消息
        this.room.onMessage((message) => {
            this.onMessageListener(message);
        });
        //开始游戏
        this.sendStartGame();
    },

    onMessageListener(message) {
        switch (message[0]) {
            case "f":
                this.onReceiveServerFrame(message);
                break;
            case "fs":
                this.onReceiveServerFrame(message);
                //把服务器帧同步到本地帧缓存后，读取并执行本地帧缓存
                this.nextTick();
                break;
            default:
                console.warn("未处理的消息:");
                console.warn(message);
                break;
        }
    },

    //接收到服务器的帧数据后，放入本地缓存帧
    onReceiveServerFrame(message) {
        this.addFrames(message[1]);
    },

    //按顺序保存至本地
    addFrames(_frames) {
        _frames.forEach((m) => {
            this.frames[m[0]] = m[1];
            for (let i = m[0]; i > m[0] - this.serverFrameAcc; i--) {
                if (this.frames[i] == undefined) {
                    this.frames[i] = [];
                }
            }
        });
    },

    //推进游戏
    nextTick() {
        this.runTick();
        if (this.frames.length - this.frame_index > 100) {
            //当缓存帧过多时，一次处理多个帧信息
            console.log("跳帧追帧:" + (this.frames.length - this.frame_index))
            this.frame_inv = 0;
        } else if (this.frames.length - this.frame_index > this.serverFrameAcc) {
            this.frame_inv = 0;
        } else {
            if (this.readyToControl == false) {
                this.readyToControl = true;
                this.onReadyToControl();
            }
            this.frame_inv = 1000 / (this.serverFrameRate * (this.serverFrameAcc + 1));
        }
        setTimeout(this.nextTick.bind(this), this.frame_inv)
    },
    

    //广播消息创建本地玩家
    onReadyToControl() {
        this.sendToRoom(["cmd", ["addplayer"]]);
    },

    //执行服务器的指令
    runTick() {
        let frame = null;
        if (this.frames.length > 1) {
            //第一帧延时处理，以免在初始的时候丢失第一帧
            frame = this.frames[this.frame_index];
        }
        if (frame) {
            if (frame.length > 0) {
                frame.forEach((cmd) => {
                    if (typeof this["cmd_" + cmd[1][0]] == "function") {
                        this["cmd_" + cmd[1][0]](cmd);
                    } else {
                        console.log("服务器处理函数cmd_" + cmd[1][0] + " 不存在");
                    }
                })
            }
            this.frame_index++;
            cc.game.step();
        }
    },

    //接收服务器的输入
    cmd_input(cmd) {
        this.players.forEach((p) => {
            let PlayerScript = p.getComponent(PlayerController);
            if (PlayerScript.sessionId == cmd[0]) {
                //根据输入指令，更新玩家坐标
                PlayerScript.updateInput(cmd[1][1])
            }
        })
    },

    //接收服务器指令，进行创建玩家
    cmd_addplayer(cmd) {
        //已经存在的玩家不需要创建
        let existPlayer = this.players.filter((p) => {
            let PlayerScript = p.getComponent(PlayerController);
            return (PlayerScript == null) ? false : (PlayerScript.sessionId == cmd[0]);
        });
        if (existPlayer.length > 0) {
        } else {
            let player = cc.instantiate(this.playerPrefab);
            player.parent = cc.find("Canvas/gameWorld");
            player.position = cc.v2(0, 0);
            let PlayerScript = player.getComponent(PlayerController);
            PlayerScript.sessionId = cmd[0];
            PlayerScript.isLocal = cmd[0] == this.room.sessionId;
            PlayerScript.setPlayerLab('玩家：' + cmd[0]);
            this.players.push(player);
        }
    },

    //向服务器发起开始游戏
    sendStartGame() {
        this.readyToControl = false;
        this.players = [];
        this.frame_inv = 0;
        //锁定帧
        cc.game.pause();
        //获取服务器上所有帧缓存
        this.sendToRoom(["fs"]);
        //以固定时间间隔上传用户输入
        setInterval(this.sendCMD.bind(this), 1000 / this.serverFrameRate);
    },

    //向服务器发送消息
    sendToRoom(data) {
        this.room.send(data);
    },

    //向服务器发送用户的操作指令
    sendCMD() {
        let getData = this.mouseInput.toServerData();
        let dir = getData.dir;
        let data = ["cmd", ["input", dir]];
        this.sendToRoom(data);
    }
});
