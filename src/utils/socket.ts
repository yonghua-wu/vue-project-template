import SockJs from "sockjs-client";
import { HOST } from "./config";
interface ListenIndex {
  eventName: any;
  index: number;
}
class Socket {
  private sockJs: WebSocket | null = null;
  private sockJsAwait: Promise<any> | null = null;
  private listenObj: any = {};
  private connectCount = 0;
  private static _interface: Socket | null = null;
  constructor() {
    this.sockJsAwait = this.connect().then((s) => {
      this.sockJs = s;
      this.sockJs.onmessage = this.onmessage();
    });
  }
  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const sockJs = new SockJs(HOST + "/api/eventbus", null, {
        transports: "xhr-polling",
      });
      sockJs.onerror = () => {
        console.log("onerror");
        if (this.connectCount > 5) {
          reject("connect fail, reconnect " + this.connectCount);
        } else {
          setTimeout(() => {
            this.connectCount++;
            this.connect().then((s) => {
              resolve(s);
            });
          }, 5000);
        }
      };
      sockJs.onclose = () => {
        console.log("onclose");
        if (this.connectCount > 5) {
          reject("connect fail, reconnect " + this.connectCount);
        } else {
          setTimeout(() => {
            this.connectCount++;
            this.connect().then((s) => {
              resolve(s);
            });
          }, 5000);
        }
      };
      sockJs.onopen = () => {
        resolve(sockJs);
      };
    });
  }
  public static getInterface() {
    if (this._interface === null) {
      this._interface = new Socket();
    }
    return this._interface;
  }
  public async subTopic(topic: string, cb: (msg: any) => void): Promise<ListenIndex> {
    if (!this.listenObj[topic]) {
      this.listenObj[topic] = [];
    }
    this.listenObj[topic].push(cb);
    await this.sockJsAwait;
    this.sockJs?.send(
      JSON.stringify({
        operation: "OP_SUB_TOPIC",
        topic: topic,
      }),
    );
    return {
      eventName: topic,
      index: this.listenObj[topic].length - 1,
    };
  }
  public async unSupTopic(listenIndex: ListenIndex) {
    if (this.listenObj[listenIndex.eventName] && this.listenObj[listenIndex.eventName][listenIndex.index]) {
      this.listenObj[listenIndex.eventName].splice(listenIndex.index, 1);
      if (this.listenObj[listenIndex.eventName].length === 0) {
        await this.sockJsAwait;
        delete this.listenObj[listenIndex.eventName];
        this.sockJs?.send(
          JSON.stringify({
            operation: "OP_UNSUB_TOPIC",
            topic: listenIndex.eventName,
          }),
        );
      }
    } else {
      throw new Error("callback is empty");
    }
  }
  private onmessage() {
    return (e: any) => {
      const msg: any = JSON.parse(e.data as string);
      if (this.listenObj[msg.topic] !== undefined) {
        this.listenObj[msg.topic].forEach((cb: (p: any) => void) => {
          if (typeof cb === "function") {
            cb(msg.data);
          }
        });
      }
    };
  }
}

export default Socket.getInterface();
