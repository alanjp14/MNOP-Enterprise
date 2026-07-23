import { fetchApi } from "@/lib/api-client";

export interface NetworkDevice {
  id: string;
  name: string;
  vendor: string;
  model: string;
  type: "router" | "switch" | "radio" | "ap" | "firewall" | "server" | "nas" | "fingerprint" | "printer" | "smarttv" | "cctv" | "ups";
  siteCategory: "BatuahSite" | "HeadOffice" | "JettyPort" | "MessPalangkaraya" | "MessBuntok";
  location: string;
  ip: string;
  status: "Online" | "Offline" | "Warning";
}

export interface DeviceListResponse {
  items: NetworkDevice[];
  total: number;
}

export const deviceService = {
  async getDevices(siteCategory?: string): Promise<NetworkDevice[]> {
    try {
      const endpoint = siteCategory && siteCategory !== "ALL"
        ? `/devices?site_category=${siteCategory}`
        : "/devices";
      const data = await fetchApi<DeviceListResponse>(endpoint);
      return data.items;
    } catch (error) {
      console.warn("Backend API unavailable, falling back to local client state:", error);
      return [];
    }
  },

  async getDeviceById(id: string): Promise<NetworkDevice> {
    return fetchApi<NetworkDevice>(`/devices/${id}`);
  },

  async createDevice(payload: Omit<NetworkDevice, "id">): Promise<NetworkDevice> {
    return fetchApi<NetworkDevice>("/devices", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateDevice(id: string, payload: Partial<NetworkDevice>): Promise<NetworkDevice> {
    return fetchApi<NetworkDevice>(`/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteDevice(id: string): Promise<void> {
    return fetchApi<void>(`/devices/${id}`, {
      method: "DELETE",
    });
  },
};
