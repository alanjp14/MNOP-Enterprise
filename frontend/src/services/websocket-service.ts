export class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;

  public getConnected(): boolean {
    return this.isConnected;
  }
  private listeners: Set<(data: any) => void> = new Set();
  private reconnectInterval = 5000;
  private url: string;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      this.url = `${wsProtocol}//${window.location.host}/api/v1/ws/metrics`;
    }
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log("🟢 WebSocket Connected to MNOP Backend Telemetry");
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(data));
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.warn("⚠️ WebSocket Disconnected. Reconnecting in 5s...");
        setTimeout(() => this.connect(), this.reconnectInterval);
      };

      this.socket.onerror = (err) => {
        console.error("WebSocket Error:", err);
        this.socket?.close();
      };
    } catch (e) {
      console.error("Failed to initiate WebSocket connection:", e);
    }
  }

  public subscribe(callback: (data: any) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const wsService = new WebSocketService();
