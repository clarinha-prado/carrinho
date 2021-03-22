export interface CartProduct {
  id: number;
  title: string;
  price: number;
  image: string;
  amount: number;
  formattedPrice: string;
  formattedSubTotal: string;
}

export interface Stock {
  id: number;
  amount: number;
}
