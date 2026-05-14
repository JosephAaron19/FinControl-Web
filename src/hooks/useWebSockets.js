import { useEffect, useRef, useCallback } from 'react';

const useWebSockets = (onMessageReceived) => {
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const callbackRef = useRef(onMessageReceived);

    // Actualizar el ref de la función callback sin disparar reconexión
    useEffect(() => {
        callbackRef.current = onMessageReceived;
    }, [onMessageReceived]);

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
            try {
                const data = JSON.parse(event.data);
                if (callbackRef.current) {
                    callbackRef.current(data);
                }
            } catch (err) {
                console.error('Error parseando mensaje WS:', err);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Desconectado. Reintentando en 5s...');
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        socket.onerror = (error) => {
            console.error('Error en WebSocket:', error);
            socket.close();
        };

        socketRef.current = socket;
    }, []); // Ya no depende de onMessageReceived

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.onclose = null; // Evitar reconexión al desmontar
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
