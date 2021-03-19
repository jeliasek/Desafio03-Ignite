import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let productOnCart = cart.find(product => product.id === productId);
      let newCart: Product[] = [];
      const { data: stock } = await api.get(`/stock/${productId}`)

      if (!productOnCart) {
        const { data } = await api.get<Product>(
          `/products/${productId}`
        );

        productOnCart = {
          ...data,
          amount: 1,
        };

        if(stock.amount <= productOnCart.amount){
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
          newCart = [...cart, productOnCart];

      } else {
        
        if(stock.amount <= productOnCart.amount){
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
          newCart = cart.map(product => product.id !== productId ? product : { ...product, amount: product.amount + 1 });
      }
      setCart(newCart)
      localStorage.setItem(`@RocketShoes:cart`, JSON.stringify(newCart));
      // TODO
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);

      if(product){ 
        const actualCart = (cart.filter((product) => product.id !== productId));
        setCart(actualCart);
        localStorage.setItem(`@RocketShoes:cart`, JSON.stringify(actualCart));
      } else {
        toast.error('Erro na remoção do produto')
      }
      
      // TODO
    } catch {
      toast.error("Erro na remoção do produto")
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const product = cart.find(product => product.id === productId);
      if (product){
        if (amount > 0) {
          const { data: stock } = await api.get(`/stock/${productId}`);
          if (stock.amount < amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          } else {
            const newCart: Product[] = cart.map(product => product.id !== productId ? product : { ...product, amount: amount });
            setCart(newCart);
            localStorage.setItem(`@RocketShoes:cart`, JSON.stringify(newCart));
          }
        } else {
          toast.error('Quantidade solicitada fora de estoque')
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto')
      }
      // TODO
    } catch {
      toast.error('Quantidade solicitada fora de estoque')
      // TODO
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
