
export interface CartItem {
  id: number;
  name: string;
  image: string;
  additionalImages?: string[];
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  description?: string;
  type: "product" | "combo";
}
