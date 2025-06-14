// src/pages/api/orders.ts
export const fetchOrders = async (search: string = '') => {
    const API_URL = import.meta.env.VITE_API_URL; // VITE_API_URL = http://localhost:5261/api
    const response = await fetch(`${API_URL}/Orders${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
};

export const approveOrder = async (id: number) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/Orders/approve/${id}`, {
        method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to approve order');
    return response.json();
};

export const cancelOrder = async (id: number, lyDoHuy: string) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await fetch(`${API_URL}/Orders/cancel/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(lyDoHuy),
    });
    if (!response.ok) throw new Error('Failed to cancel order');
    return response.json();
};