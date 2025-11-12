import { invoke } from "@tauri-apps/api/core";
import { ThemeManager, MenuManager, ShortcutManager, HorizontalCarousel, addMedia, removeMedia } from "./scripts";

let currentShortcutItem: HTMLElement | null = null;
let capturedKey: string | null = null;
let shortcutManager: ShortcutManager;

async function loadMaps() {
  const maps = await invoke<Array<MapDto>>("get_maps");
  const container = document.getElementById("carouselTrack");
  if (!container) return;

  maps.forEach((map, idx) => {
    const div = document.createElement("div");
    const classMap = idx === 0 ? "carousel-item active" : "carousel-item";
    div.innerHTML = `
      <a href="#" class="${classMap}" data-map-id="${map.id}">
          <div class="icon">
              <img src="${map.imagePath}">
          </div>
          <div class="text">${map.name}</div>
      </a>
    `;
    
    // Adiciona o evento de clique diretamente
    const link = div.querySelector('a');
    link?.addEventListener('click', (e) => {
      e.preventDefault();
      onMapClick(map.id);
    });
    
    container.appendChild(div);
  });

  const firstMap = maps.length > 0 ? maps[0] : null;
  if (firstMap) {
    onMapClick(firstMap.id);
  }
}

async function onMapClick(id: number) {
  const items = document.querySelectorAll('.carousel-item');
  items.forEach(item => item.classList.remove('active'));

  const clicked = document.querySelector(`.carousel-item[data-map-id="${id}"]`);
  if (clicked) {
    clicked.classList.add('active');
  }

  loadShortcutsByMap(id);
}

function openShortcutPopup(item: HTMLElement | null) {
  currentShortcutItem = item;
  capturedKey = null;
  const capturedKeyEl = document.getElementById("capturedKey");
  if (capturedKeyEl) {
    capturedKeyEl.textContent = "...";
  }
  
  const popup = document.getElementById("shortcutPopup");
  if (popup) {
    popup.classList.remove("hidden");
  }

  document.removeEventListener("keydown", captureKey);
  document.addEventListener("keydown", captureKey);
}

function captureKey(e: KeyboardEvent) {
  e.preventDefault();
  capturedKey = formatKey(e);
  const capturedKeyEl = document.getElementById("capturedKey");
  if (capturedKeyEl) {
    capturedKeyEl.textContent = capturedKey;
  }
}

function formatKey(e: KeyboardEvent): string {
  const keys: string[] = [];
  if (e.ctrlKey) keys.push("Ctrl");
  if (e.altKey) keys.push("Alt");
  if (e.shiftKey) keys.push("Shift");
  keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
  return keys.join(" + ");
}

function initShortcutPopup() {
  const confirmBtn = document.getElementById("confirmShortcut");
  const cancelBtn = document.getElementById("cancelShortcut");

  confirmBtn?.addEventListener("click", async () => {
    if (!capturedKey) {
      await invoke("log_message", { message: "No key captured." });
      return;
    }

    const description = (
      currentShortcutItem?.querySelector(".shortcut-description") as HTMLTextAreaElement
    )?.value ?? "";

    const activeMap = document.querySelector(".carousel-item.active") as HTMLElement;
    const mapId = activeMap?.dataset ? parseInt(activeMap.dataset?.mapId ?? '') : 0;
    
    if (!mapId) {
      await invoke("log_message", { message: "No active map selected." });
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
        shortcutManager.addShortcut(shortcutId, capturedKey, '');
      }

      document.getElementById("shortcutPopup")?.classList.add("hidden");
      document.removeEventListener("keydown", captureKey);
    } catch (error) {
      await invoke("log_message", { message: "Error saving shortcut " + error });
    }
  });

  cancelBtn?.addEventListener("click", () => {
    document.getElementById("shortcutPopup")?.classList.add("hidden");
    document.removeEventListener("keydown", captureKey);
  });
}

function loadShortcutsByMap(mapId: number) {
  invoke<Array<ShortcutDto>>("list_shortcuts_by_map", { mapId })
    .then(shortcuts => {
      shortcutManager.setShortcuts(shortcuts);
    })
    .catch(async (error) => {
      await invoke("log_message", { message: "Error loading shortcuts: " + error });
    });
}

function editShortcut(button: HTMLElement): void {
  const item = button.closest(".shortcut-item") as HTMLElement;
  openShortcutPopup(item);
}

function addShortcut(): void {
  openShortcutPopup(null);
}

// Declare tipos globais
declare global {
  interface Window {
    addMedia: typeof addMedia;
    removeMedia: typeof removeMedia;
    editShortcut: (button: HTMLElement) => void;
    addShortcut: () => void;
  }
}

// INICIALIZAÇÃO - SEM DOMContentLoaded
async function init() {
  console.log("Iniciando aplicação...");
  
  try {
    const themeManager = new ThemeManager();    
    const menuManager = new MenuManager();
    
    const carouselEl = document.getElementById('carousel');
    if (carouselEl) {
      new HorizontalCarousel(carouselEl);
    }
    
    shortcutManager = new ShortcutManager();
    window.addMedia = addMedia;
    window.removeMedia = removeMedia;
    window.editShortcut = editShortcut;
    window.addShortcut = addShortcut;

    initShortcutPopup();
    
    await loadMaps();
    console.log("Maps carregados");
  } catch (error) {
    console.error("Erro na inicialização:", error);
  }
}

// Executar quando o módulo carregar
init();