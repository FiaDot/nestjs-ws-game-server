import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket'] })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  logger = new Logger();

  // 해당 소켓이 접속중인가?
  clients: { [socketId: string]: boolean } = {};

  // 채팅 채널
  channels: { [socketId: string]: string } = {};

  // 채널에 있는 유저
  channelUsers: { [key: string]: string[] } = {};

  lastTick: number;
  dt: number;

  constructor() {
    const start = performance.now();
    const end = performance.now();
    // const inSeconds = (end - start) / 1000;
    // return Number(inSeconds).toFixed(0);

    this.lastTick = performance.now();
    this.dt = performance.now();
    // setInterval(this.handleTick, 100);
    // this.startProcessing();
  }

  handleTick() {
    const at = performance.now();
    this.dt = at - this.lastTick;
    this.lastTick = at;

    console.log(`tick! ${this.dt}`);
    // console.log(`tick! `);
    // setTimeout(() => {
    //   this.handleTick();
    // }, 100);
  }
  private running: boolean = false;

  async startProcessing(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    while (this.running) {
      await this.processFrame();
      await this.wait(33); // Wait for approximately 30fps (33 milliseconds)
    }
  }

  async stopProcessing(): Promise<void> {
    this.running = false;
  }

  private async processFrame(): Promise<void> {
    // Your processing logic here

    const at = performance.now();
    this.dt = at - this.lastTick;
    this.lastTick = at;

    console.log(`tick! ${this.dt}`);
    // console.log('Processing frame...');
    // Do something with the frame
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 접속 이벤트
  // handleConnection(@ConnectedSocket() client: any) {
  handleConnection(client: Socket): void {
    client.emit('connected', { clientId: client.id });

    // 중복 접속
    if (this.clients[client.id]) {
      this.logger.warn(`[Connect] dup client.id=${client.id}`);
      client.disconnect(true);
      return;
    }

    this.logger.log(`[Connect] client.id=${client.id}`);
    this.clients[client.id] = true;

    // client.data는 custom data 관리용
    // client.data.channel = 'test';
  }

  // 접속 끊김 이벤트
  handleDisconnect(client: Socket): void {
    delete this.clients[client.id];
    this.logger.log(`[Disconn] client.id=${client.id}`);
    // TODO : 방에서 빼줘
    // TODO : 방의 유저들에게 알림
    // this.logger.debug(`[leave] client.data.channel=${client.data.channel}`);

    this.handleLeave(client);
  }

  // @SubscribeMessage('message')
  // 클라이언트 직접 사용하거나, 데코레이터 안 쓸 때?
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }

  // @SubscribeMessage('message')
  // handleMessage(@MessageBody() message: string): void {
  //   this.server.emit('message', message);
  // }

  @SubscribeMessage('test')
  // handleMessage(client: Socket, payload: any): void {
  handleTest(client: Socket, payload: string): void {
    this.server.emit('test', payload);
    this.logger.log(`[test] client.id=${client.id},payload=${payload}`);
  }

  @SubscribeMessage('message')
  // handleMessage(client: Socket, payload: any): void {
  handleMessage(client: Socket, payload: { data: string }): void {
    this.server.emit('message', payload);

    this.logger.log(`[message] client.id=${client.id},payload=${payload}`);
    this.logger.log(`[message] client.id=${client.id},msg=${payload?.data}`);
  }

  @SubscribeMessage('unity')
  // handleMessage(client: Socket, payload: any): void {
  handleUnity(client: Socket, payload: { data: string }): void {
    // const enc = JSON.parse(payload);
    // this.server.emit('unity', JSON.stringify(enc)); // ["{\"data\":\"unity dedi\"}"]

    this.logger.log(`[message] client.id=${client.id},payload=${payload}`);
    this.logger.log(`[message] client.id=${client.id},msg=${payload?.data}`);

    // this.server.emit('unity', JSON.stringify({ data: 'echo' })); // 클라 처리 못함
    this.server.emit('unity', { data: 'echo2' }); // 성공
    this.server.emit('unity', payload); // 성공
  }

  // TODO : room management

  @SubscribeMessage('join')
  handleJoin(client: Socket, channel: string) {
    // 이미 접속한 채널
    if (client.rooms.has(channel)) return;

    client.join(channel);
    client.data.channel = channel;

    // 빈 채널이면 초기화
    if (!this.channelUsers[channel]) {
      this.channelUsers[channel] = [];
    }

    this.channelUsers[channel].push(client.id);

    // 신규 진입 유저 알림
    this.server.to(channel).emit('joinUser', { channel, clientId: client.id });

    // 해당 채널 유저 정보 나에게 보내야 하는데...
    //client.emit('channelUsers', { channel, users: this.channelUsers[channel] });
    client.broadcast.emit('channelUsers', {
      channel,
      users: this.channelUsers[channel],
    });

    // TODO : 기존 유저도 유저목록 업데이트 (overhead)
  }

  @SubscribeMessage('leave')
  handleLeave(client: Socket) {
    const channel = client.data.channel;

    // 방에 없으면 무시
    if (!client.rooms.has(channel)) return;

    client.leave(channel);
    client.data.channel = null;

    const idx = this.channelUsers[channel]?.indexOf(client.id);
    if (idx !== -1) {
      // 빼자!
      this.channelUsers[channel].slice(idx, 1);

      // 사용자 나감 알림
      this.server
        .to(channel)
        .emit('leaveUser', { channel, clientId: client.id });
    }

    // TODO : 유저 목록 업데이트?
  }

  // @Interval(10000)
  // handleInterval() {
  //   this.logger.debug('Called every 10 seconds');
  // }
}
