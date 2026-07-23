import { create } from "zustand";
import type { LiveEvent } from "@/types";
import { playDownSound, playUpSound } from "@/utils/sound-alerts";

interface EventState {
  events: LiveEvent[];
  addEvent: (event: Omit<LiveEvent, "id">) => void;
  clearEvents: () => void;
}

const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: "evt-1",
    message: "WAN1 Starlink Gen3 is Online & Stable",
    timestamp: Date.now() - 1000 * 60 * 2,
    severity: "info",
    source: "Core Router CCR2004",
    type: "up",
  },
  {
    id: "evt-2",
    message: "Real-time state change detected - ether3 (WAN3 Lintasmaya)",
    timestamp: Date.now() - 1000 * 60 * 5,
    severity: "warning",
    source: "Core Router CCR2004",
    type: "warning",
  },
  {
    id: "evt-3",
    message: "Radio PIT-2 (Site B) high latency warning",
    timestamp: Date.now() - 1000 * 60 * 12,
    severity: "warning",
    source: "Radio PIT-2 (Site B)",
    type: "warning",
  },
  {
    id: "evt-4",
    message: "Workshop Switch interface ether5 DOWN",
    timestamp: Date.now() - 1000 * 60 * 25,
    severity: "critical",
    source: "Workshop Switch",
    type: "down",
  },
  {
    id: "evt-5",
    message: "Fortigate Firewall RADIUS Auth Sync Complete",
    timestamp: Date.now() - 1000 * 60 * 40,
    severity: "info",
    source: "Fortigate Firewall",
    type: "info",
  },
];

export const useEventStore = create<EventState>((set) => ({
  events: INITIAL_EVENTS,
  addEvent: (newEventData) => {
    if (newEventData.type === "down" || newEventData.severity === "critical" || newEventData.severity === "error") {
      playDownSound();
    } else if (newEventData.type === "up") {
      playUpSound();
    }

    set((state) => {
      const newEvent: LiveEvent = {
        ...newEventData,
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
      return { events: [newEvent, ...state.events].slice(0, 100) };
    });
  },
  clearEvents: () => set({ events: [] }),
}));
