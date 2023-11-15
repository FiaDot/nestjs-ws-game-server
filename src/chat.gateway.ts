import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  logger = new Logger();

  // 해당 소켓이 접속중인가?
  clients: { [socketId: string]: boolean } = {};

  // 접속 이벤트
  handleConnection(client: Socket): void {
    // 중복 접속
    if (this.clients[client.id]) {
      this.logger.warn(`[Connect] dup client.id=${client.id}`);
      client.disconnect(true);
      return;
    }

    this.logger.log(`[Connect] client.id=${client.id}`);
    this.clients[client.id] = true;
  }

  // 접속 끊김 이벤트
  handleDisconnect(client: Socket): void {
    delete this.clients[client.id];
    this.logger.log(`[Disconn] client.id=${client.id}`);
    // TODO : 방에서 빼줘
    // TODO : 방의 유저들에게 알림
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

  @SubscribeMessage('message')
  // handleMessage(client: Socket, payload: any): void {
  handleMessage(client: Socket, payload: { data: string }): void {
    this.server.emit('message', payload);
    this.logger.log(`[message] client.id=${client.id},msg=${payload?.data}`);
  }
}
