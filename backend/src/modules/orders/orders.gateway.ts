import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'orders' })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) client.join(`tenant:${tenantId}`);
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('join-kitchen')
  handleJoinKitchen(@ConnectedSocket() client: Socket, @MessageBody() data: { tenantId: string; branchId?: string }) {
    client.join(`kitchen:${data.tenantId}${data.branchId ? `:${data.branchId}` : ''}`);
    return { status: 'joined' };
  }

  @SubscribeMessage('join-cashier')
  handleJoinCashier(@ConnectedSocket() client: Socket, @MessageBody() data: { tenantId: string }) {
    client.join(`cashier:${data.tenantId}`);
    return { status: 'joined' };
  }

  emitNewOrder(tenantId: string, order: any, branchId?: string) {
    this.server.to(`kitchen:${tenantId}${branchId ? `:${branchId}` : ''}`).emit('new-order', order);
    this.server.to(`cashier:${tenantId}`).emit('new-order', order);
    this.server.to(`tenant:${tenantId}`).emit('order-update', order);
  }

  emitOrderStatusChange(tenantId: string, order: any) {
    this.server.to(`tenant:${tenantId}`).emit('order-status-changed', order);
    this.server.to(`cashier:${tenantId}`).emit('order-status-changed', order);
    if (order.clientId) {
      this.server.to(`user:${order.clientId}`).emit('your-order-updated', order);
    }
  }
}
