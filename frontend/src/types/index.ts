/**
 * Tipe data umum untuk aplikasi frontend dashboard MNOP.
 */

export type Status = 'online' | 'offline' | 'warning' | 'maintenance' | 'unknown';
export type AdminStatus = 'up' | 'down' | 'testing';
export type OperStatus = 'up' | 'down' | 'testing' | 'unknown' | 'dormant' | 'notPresent' | 'lowerLayerDown';
export type EventSeverity = 'info' | 'warning' | 'critical' | 'error';

export interface Device {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'ap' | 'server' | 'other';
  vendor: string;
  model: string;
  ip: string;
  status: Status;
  site: string;
  location: string;
  lastSeen: string;
}

export interface DeviceInterface {
  id: string;
  deviceId: string;
  name: string;
  displayName: string;
  type: string;
  speed: number;
  adminStatus: AdminStatus;
  operStatus: OperStatus;
  isWan: boolean;
  isUplink: boolean;
}

export interface TrafficData {
  time: string;
  rx: number;
  tx: number;
}

export interface SlaData {
  interfaceId: string;
  interfaceName: string;
  percentage: number;
  upSeconds: number;
  downSeconds: number;
  outageCount: number;
  period: 'day' | 'week' | 'month' | 'year';
}

export interface PingTarget {
  id: string;
  name: string;
  host: string;
  icon?: string;
  latencyMs: number;
  status: Status;
  packetLoss: number;
}

export interface LiveEvent {
  id: string;
  message: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical' | 'error';
  source: string;
  type: 'up' | 'down' | 'warning' | 'info';
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  storage: number;
  temperature?: number;
  timestamp: string;
}

export interface CheckState {
  checkId: string;
  status: Status;
  statusSince: string;
  lastLatency: number;
  consecutiveFailures: number;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  timezone: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'operator' | 'viewer';
  organization: Organization;
}

export interface SlaReport {
  interfaceId: string;
  periodStart: string;
  periodEnd: string;
  downloadStats: {
    avgBps: number;
    maxBps: number;
    totalBytes: number;
  };
  uploadStats: {
    avgBps: number;
    maxBps: number;
    totalBytes: number;
  };
  downCount: number;
  uptimeDuration: number;
  downtimeDuration: number;
  availabilityPercentage: number;
}
