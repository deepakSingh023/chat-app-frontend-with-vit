// src/socket.js
import { io } from 'socket.io-client';

export const socket = io('http://localhost:5000'); // Adjust the URL if necessary
