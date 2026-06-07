import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/ws/notifications',
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173' },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (${this.connectedClients} total)`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} (${this.connectedClients} total)`);
  }

  /**
   * Emite una actualización de precio a todos los clientes conectados
   */
  broadcastPriceUpdate(data: { symbol: string; price: number; change: number; timestamp: string }) {
    this.server.emit('price_update', data);
  }

  /**
   * Emite una notificación de agente a un cliente específico o a todos
   */
  broadcastNotification(notification: {
    type: 'price_alert' | 'rebalance_completed' | 'trade_executed' | 'error';
    payload: { title: string; message: string; severity: 'info' | 'warning' | 'error'; data?: any };
  }) {
    this.server.emit('notification', notification);
  }
}
