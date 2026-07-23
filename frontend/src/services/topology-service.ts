import { fetchApi } from "@/lib/api-client";

export interface TopologyNode {
  id: string;
  name: string;
  type: "router" | "switch" | "radio" | "ap" | "firewall" | "vpn" | "server" | "nas" | "fingerprint" | "printer" | "smarttv" | "cctv" | "ups" | string;
  siteCategory: "BatuahSite" | "HeadOffice" | "JettyPort" | "MessPalangkaraya" | "MessBuntok" | string;
  location: string;
  ip: string;
  status: "Online" | "Warning" | "Offline" | string;
  x: number;
  y: number;
  vpnTunnel?: string;
}

export interface TopologyLink {
  id: string;
  from: string;
  to: string;
  label: string;
  isVpn: boolean;
  bandwidth: string;
}

export interface TopologyLinkCreatePayload {
  from_device: string;
  to_device: string;
  label: string;
  isVpn: boolean;
  bandwidth: string;
}

export const topologyService = {
  async getNodes(): Promise<TopologyNode[]> {
    return fetchApi<TopologyNode[]>("/topology/nodes");
  },

  async updateNodeCoordinates(id: string, x: number, y: number): Promise<TopologyNode> {
    return fetchApi<TopologyNode>(`/topology/nodes/${id}/coordinates`, {
      method: "PUT",
      body: JSON.stringify({ x, y }),
    });
  },

  async getLinks(): Promise<TopologyLink[]> {
    const rawLinks = await fetchApi<any[]>("/topology/links");
    return rawLinks.map((link) => ({
      id: link.id,
      from: link.from_device,
      to: link.to_device,
      label: link.label,
      isVpn: link.isVpn,
      bandwidth: link.bandwidth,
    }));
  },

  async createLink(payload: TopologyLinkCreatePayload): Promise<TopologyLink> {
    const link = await fetchApi<any>("/topology/links", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      id: link.id,
      from: link.from_device,
      to: link.to_device,
      label: link.label,
      isVpn: link.isVpn,
      bandwidth: link.bandwidth,
    };
  },

  async deleteLink(id: string): Promise<void> {
    return fetchApi<void>(`/topology/links/${id}`, {
      method: "DELETE",
    });
  }
};
