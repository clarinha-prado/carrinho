import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { CartProduct, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: CartProduct[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<CartProduct[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // busca produto solicitado na base de produtos
      api.get('products/' + productId)
        .then((response) => {

          // converte retorno para tipo CartProduct
          let selectedProduct: CartProduct = response.data;

          console.log('cart: ' + JSON.stringify(cart));

          // se o produto já estiver no carrinho
          const existingProduct = cart.find((product) => product.id === productId);
          if (existingProduct !== undefined) {

            // obter qtde em estoque
            api.get('stock/' + productId)
              .then((response) => {
                let qtdStock: Stock = response.data;

                // se a qtde selecionada > qtde em estoque
                if (existingProduct.amount + 1 > qtdStock.amount) {
                  toast.error('Quantidade solicitada fora de estoque');
                } else {
                  existingProduct.amount += 1;
                  console.log('nova qtde: ' + existingProduct.amount);
                }
              })
          } else {
            // se o produto não estiver no carrinho, acrescentar o produto no carrinho
            console.log('produto novo!');

            selectedProduct.amount = 1;
            console.log(selectedProduct);
            setCart([
              ...cart,
              selectedProduct
            ]);
          }
        })
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // se o produto estiver no carrinho
      const existingProduct = cart.find((product) => product.id === productId);
      if (existingProduct !== undefined) {
        setCart(cart.filter((product) => product.id !== productId));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
