import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';


export interface CartItem {
    id: string | number;
    name: string;
    price: number;
    image: string;
    category: string;
    quantity: number;
    stock_quantity: number;
    selectedVariations?: { [key: string]: string };
}


interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, selectedVariations?: { [key: string]: string }) => void;
    removeFromCart: (productId: string | number, selectedVariations?: { [key: string]: string }) => void;
    updateQuantity: (productId: string | number, quantity: number, selectedVariations?: { [key: string]: string }) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: any, selectedVariations?: { [key: string]: string }) => {
        const stockAvailable = product.stock_quantity ?? 999;
        const requestedQuantity = product.quantity || 1;

        if (stockAvailable <= 0) {
            toast.error('Produto sem estoque disponível.');
            return;
        }

        setIsCartOpen(true);

        setCart(prev => {
            const existing = prev.find(item => 
                item.id === product.id && 
                JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations)
            );
            
            if (existing) {
                const newQuantity = existing.quantity + requestedQuantity;
                if (newQuantity > stockAvailable) {
                    toast.error(`Apenas ${stockAvailable} unidades disponíveis em estoque.`);
                    return prev.map(item =>
                        (item.id === product.id && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations))
                            ? { ...item, quantity: stockAvailable } 
                            : item
                    );
                }
                return prev.map(item =>
                    (item.id === product.id && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations))
                        ? { ...item, quantity: newQuantity } 
                        : item
                );
            }

            if (requestedQuantity > stockAvailable) {
                toast.error(`Apenas ${stockAvailable} unidades disponíveis em estoque.`);
                return [...prev, { ...product, quantity: stockAvailable, stock_quantity: stockAvailable, selectedVariations }];
            }

            return [...prev, { ...product, quantity: requestedQuantity, stock_quantity: stockAvailable, selectedVariations }];
        });
    };


    const removeFromCart = (productId: string | number, selectedVariations?: { [key: string]: string }) => {
        setCart(prev => prev.filter(item => 
            !(item.id === productId && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations))
        ));
    };

    const updateQuantity = (productId: string | number, quantity: number, selectedVariations?: { [key: string]: string }) => {
        if (quantity < 1) return;
        
        setCart(prev => prev.map(item => {
            if (item.id === productId && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations)) {
                if (quantity > item.stock_quantity) {
                    toast.error(`Apenas ${item.stock_quantity} unidades disponíveis em estoque.`);
                    return { ...item, quantity: item.stock_quantity };
                }
                return { ...item, quantity };
            }
            return item;
        }));
    };


    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, isCartOpen, setIsCartOpen }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
