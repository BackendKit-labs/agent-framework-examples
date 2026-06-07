export interface AgentMessage {
  type: string;
  payload: any;
  metadata: {
    correlationId: string;
    source: string;
    timestamp: string;
    replyTo?: string;
  };
}
