import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'billiard' })
export class BilliardGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const clubId = client.handshake.query.clubId as string;
    const userId = client.handshake.query.userId as string;
    if (clubId) client.join(`club:${clubId}`);
    if (userId) client.join(`user:${userId}`);
  }

  @SubscribeMessage('join-club')
  joinClub(@ConnectedSocket() client: Socket, @MessageBody() data: { clubId: string }) {
    if (data?.clubId) client.join(`club:${data.clubId}`);
    return { status: 'joined' };
  }

  @SubscribeMessage('join-user')
  joinUser(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (data?.userId) client.join(`user:${data.userId}`);
    return { status: 'joined' };
  }

  emitClub(clubId: string, event: string, payload: any) {
    this.server.to(`club:${clubId}`).emit(event, payload);
  }

  emitUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
