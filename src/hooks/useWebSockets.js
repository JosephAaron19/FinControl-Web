import { useEffect, useRef, useCallback } from 'react';

const useWebSockets = (onMessageReceived) => {
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '/ws/notifications/');
        
        console.log('Conectando a WebSocket:', wsUrl);
        
        const socket = new WebSocket(`${wsUrl}?token=${token}`);

        socket.onopen = () => {
            console.log('WebSocket Conectado');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (onMessageReceived) {
                onMessageReceived(data);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Desconectado. Reintentando...');
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        socket.onerror = (error) => {
            console.error('Error en WebSocket:', error);
            socket.close();
        };

        socketRef.current = socket;
    }, [onMessageReceived]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return socketRef.current;
};

export default useWebSockets;
