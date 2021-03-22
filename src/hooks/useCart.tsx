import { formatPrice } from '../util/format';
import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {

      // se o produto já estiver no carrinho
      const existingProduct = cart.find((product) => product.id === productId);
      if (existingProduct !== undefined) {

        // obter qtde em estoque
        await api.get('stock/' + productId)
          .then((response) => {

            if (response.status === 404) {
              throw new Error('Erro na adição do produto');
            }

            let qtdStock: Stock = response.data;

            // se a qtde selecionada > qtde em estoque
            if (existingProduct.amount + 1 > qtdStock.amount) {
              toast.error('Quantidade solicitada fora de estoque');
            } else {

              // se tiver a qtde solicitada no estoque
              existingProduct.amount += 1;
              setCart(cart.slice());
            }
          })
      } else {
        // se o produto não estiver no carrinho, busca na base de produtos
        await api.get('products/' + productId)
          .then((response) => {

            // se o produto não estiver na base de produtos, dá erro
            if (response.status === 404) {
              throw new Error('Erro na adição do produto');
            } else {
              // converte retorno para tipo CartProduct
              let selectedProduct: CartProduct = response.data;

              selectedProduct.amount = 1;
              formatPrice(selectedProduct.price * selectedProduct.amount);
              setCart([
                ...cart,
                selectedProduct
              ]);
            }
          })
      }

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
      } else {
        throw new Error('Erro na remoção do produto');
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
      // se nova qtde <= 0 sai da função
      if (amount <= 0) {
        return;
      }

      // obter qtde em estoque
      await api.get('stock/' + productId)
        .then((response) => {

          if (response.status === 404) {
            throw new Error('Erro na alteração de quantidade do produto');
          } else {
            // obtém qtde em estoque
            let qtdStock: Stock = response.data;

            // se a nova qtde > qtde em estoque
            if (amount > qtdStock.amount) {
              toast.error('Quantidade solicitada fora de estoque');
            } else {
              // busca produto no carrinho
              const existingProduct = cart.find((product) => product.id === productId);
              if (existingProduct !== undefined) {
                // atualiza a qtde
                existingProduct.amount = amount;
                // atualiza carrinho no estado 
                setCart(cart.slice());
              }
            }
          }
        })
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
