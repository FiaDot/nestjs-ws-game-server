import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  // 클라이언트 직접 사용하거나, 데코레이터 안 쓸 때?
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
  handleMessage(@MessageBody() message: string): void {
    this.server.emit('message', message);
  }
}
