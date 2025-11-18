import { invoke } from "@tauri-apps/api/core";
import { ThemeManager, MenuManager, HorizontalCarousel, addMedia, removeMedia } from "./scripts";
import { initShortcutPopup, openShortcutPopup } from "./popup-shortcut";
import { ShortcutManager } from "./shortcut-manager";
import { logMessage } from "./logger";

export let shortcutManager: ShortcutManager;

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

function loadShortcutsByMap(mapId: number) {
  invoke<Array<ShortcutDto>>("list_shortcuts_by_map", { mapId })
    .then(shortcuts => {
      shortcutManager.setShortcuts(shortcuts);
    })
    .catch(async (error) => {
      logMessage("Error loading shortcuts: " + error);
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