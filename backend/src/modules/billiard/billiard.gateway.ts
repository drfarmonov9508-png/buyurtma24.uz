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
    if (clubId) client.join(`club:${clubId}`);
  }

  @SubscribeMessage('join-club')
  joinClub(@ConnectedSocket() client: Socket, @MessageBody() data: { clubId: string }) {
    if (data?.clubId) client.join(`club:${data.clubId}`);
    return { status: 'joined' };
  }

  emitClub(clubId: string, event: string, payload: any) {
    this.server.to(`club:${clubId}`).emit(event, payload);
  }
}
