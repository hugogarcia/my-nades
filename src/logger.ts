import { invoke } from "@tauri-apps/api/core";

export function logMessage(message: string): void {
    const now = new Date();
    invoke("log_message", { message: `${now.toISOString()} - ${message}` });
}