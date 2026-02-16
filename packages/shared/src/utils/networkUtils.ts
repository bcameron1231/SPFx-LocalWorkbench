import * as net from 'net';

/**
 * Check if a port is reachable on a given host
 * @param host Hostname or IP address
 * @param port Port number to check
 * @param timeout Timeout in milliseconds (default: 1000)
 * @returns Promise that resolves to true if port is reachable
 */
export function isPortReachable(
    host: string, 
    port: number, 
    timeout = 1000
): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.once('connect', () => { socket.destroy(); resolve(true); });
        socket.once('timeout', () => { socket.destroy(); resolve(false); });
        socket.once('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, host);
    });
}
