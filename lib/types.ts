export type OrderStatus = "new" | "cooking" | "ready" | "served";

export interface Order {
  id: number;
  num: number;
  kiosk: number;
  name: string;
  base: string | null;
  legumes: string[];
  proteine: string | null;
  qty: number;
  tips: string[];
  extras: string[];
  /** Tous les bols de la commande (vide pour les anciennes commandes). */
  bowls?: import("./menu").Bowl[];
  status: OrderStatus;
  cook: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opening {
  id: number;
  day: string; // YYYY-MM-DD (heure de Paris)
  time: string; // HH:MM
  seats: number;
  booked: number;
}

export type RequestStatus = "pending" | "accepted" | "refused";

export interface Reservation {
  id: number;
  opening_id: number | null;
  name: string;
  people: number;
  status: RequestStatus;
  note: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface Settings {
  next_num: number;
  active_cook: string;
}

export interface FullState {
  settings: Settings;
  openings: Opening[];
  requests: Reservation[];
  orders: Order[];
}

export interface PublicOpening {
  id: number;
  day: string;
  time: string;
  left: number;
}
