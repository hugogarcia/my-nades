import { invoke } from "@tauri-apps/api/core";
import { shortcutManager } from "./main";
import { logMessage } from "./logger";

let currentShortcutItem: HTMLElement | null = null;
let capturedKey: string | null = null;

export function openShortcutPopup(item: HTMLElement | null) {
  currentShortcutItem = item;
  capturedKey = null;
  const capturedKeyEl = document.getElementById("capturedKey");
  if (capturedKeyEl) {
    capturedKeyEl.textContent = "...";
  }

  clearPopupMessage()
  
  const popup = document.getElementById("shortcutPopup");
  if (popup) {
    popup.classList.remove("hidden");
  }

  document.removeEventListener("keydown", captureKey);
  document.addEventListener("keydown", captureKey);
}

function captureKey(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    capturedKey = formatKey(e);
    const capturedKeyEl = document.getElementById("capturedKey");
    if (capturedKeyEl) {
        capturedKeyEl.textContent = capturedKey;
    }
    
    validateShortcut(capturedKey);
}

function validateShortcut(shortcutKey: string) {
    const messageEl = document.getElementById("shortcutMessage");
    const confirmBtn = document.getElementById("confirmShortcut") as HTMLButtonElement;
    
    if (!messageEl || !confirmBtn) return;
    
    // Pega o ID do shortcut atual (se estiver editando)
    const currentShortcutId = currentShortcutItem?.dataset?.id ?? null;
    
    // Verifica se o atalho já existe em outro item
    const allShortcuts = document.querySelectorAll('.shortcut-item');
    let isDuplicate = false;
    let duplicateDescription = "";
    
    allShortcuts.forEach(item => {
        const itemElement = item as HTMLElement;
        const itemId = itemElement.dataset.id;
        const input = itemElement.querySelector('.shortcut-key') as HTMLInputElement;
        const textarea = itemElement.querySelector('.shortcut-description') as HTMLTextAreaElement;
        
        // Ignora o item atual (quando está editando)
        if (itemId === currentShortcutId) return;
        
        if (input && input.value === shortcutKey) {
            isDuplicate = true;
            duplicateDescription = textarea?.value || "sem descrição";
        }
    });
    
    if (isDuplicate) {
        setPopupMessage();
        confirmBtn.disabled = true;
    } else {
        clearPopupMessage();
        confirmBtn.disabled = false;
    }
}

function clearPopupMessage() {
  const messageEl = document.getElementById("shortcutMessage");
  if (messageEl) {
      messageEl.textContent = "";
      messageEl.className = "shortcut-message hidden";
  }
}

function setPopupMessage() {
    const messageEl = document.getElementById("shortcutMessage");
    messageEl.textContent = `⚠️ Este atalho já está sendo usado"`;
    messageEl.className = "shortcut-message warning";
}

function formatKey(e: KeyboardEvent): string {
    const keys: string[] = [];
    if (e.ctrlKey) keys.push("Ctrl");
    if (e.altKey) keys.push("Alt");
    if (e.shiftKey) keys.push("Shift");
    
    // Ignora as teclas modificadoras sozinhas
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return keys.join(" + ");
    }
    
    keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    return keys.join(" + ");
}

export function initShortcutPopup() {
  const confirmBtn = document.getElementById("confirmShortcut");
  const cancelBtn = document.getElementById("cancelShortcut");

  clearPopupMessage();

  confirmBtn?.addEventListener("click", async () => {
    if (!capturedKey) {
      logMessage("No key captured");
      return;
    }

    const description = (
      currentShortcutItem?.querySelector(".shortcut-description") as HTMLTextAreaElement
    )?.value ?? "";

    const activeMap = document.querySelector(".carousel-item.active") as HTMLElement;
    const mapId = activeMap?.dataset ? parseInt(activeMap.dataset?.mapId ?? '') : 0;
    
    if (!mapId) {
      logMessage("No active map selected");
      return;
    }

    let shortcutId = parseInt(currentShortcutItem?.dataset?.id ?? '0');

    try {
      shortcutId = await invoke<number>("save_shortcut", {
        mapId,
        shortcut: capturedKey,
        description: description,
        id: shortcutId || null
      });

      if (currentShortcutItem) {
        const input = currentShortcutItem.querySelector(".shortcut-key") as HTMLInputElement;
        if (input) {
          input.value = capturedKey;
        }
      } else {
        const s = <ShortcutDto>{
          id: shortcutId,
          mapId: mapId,
          description: description,
          shortcut: capturedKey
        }

        shortcutManager.addShortcut(s, true);
      }

      document.getElementById("shortcutPopup")?.classList.add("hidden");
      document.removeEventListener("keydown", captureKey);
    } catch (error) {
      logMessage("Error saving shortcut " + error);
    }
  });

  cancelBtn?.addEventListener("click", () => {
    clearPopupMessage();
    document.getElementById("shortcutPopup")?.classList.add("hidden");
    document.removeEventListener("keydown", captureKey);
  });
}