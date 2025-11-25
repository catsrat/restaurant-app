export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid';
export type OrderType = 'dine-in' | 'takeaway';

export interface Table {
    id: string;
    name: string;
    status: 'available' | 'occupied';
}

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: string;
    tableId?: string;
    contactNumber?: string;
    orderType: OrderType;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    image_url?: string;
    is_available?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
    {
        id: '1',
        name: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, and cheese',
        price: 12.99,
        category: 'Burgers',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVyZ2VyfGVufDB8fDB8fHww'
    },
    {
        id: '2',
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, tomato sauce, and basil',
        price: 14.99,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cGl6emF8ZW58MHx8MHx8fDA%3D'
    },
    {
        id: '3',
        name: 'Caesar Salad',
        description: 'Romaine lettuce, croutons, parmesan, and caesar dressing',
        price: 9.99,
        category: 'Salads',
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2Flc2FyJTIwc2FsYWR8ZW58MHx8MHx8fDA%3D'
    },
    {
        id: '4',
        name: 'French Fries',
        description: 'Crispy golden fries',
        price: 4.99,
        category: 'Sides',
        image: 'https://images.unsplash.com/photo-1573080496987-8198cb147a81?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZnJpZXN8ZW58MHx8MHx8fDA%3D'
    },
    {
        id: '5',
        name: 'Cola',
        description: 'Chilled carbonated soft drink',
        price: 2.99,
        category: 'Drinks',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29sYXxlbnwwfHwwfHx8MA%3D%3D'
    }
];
