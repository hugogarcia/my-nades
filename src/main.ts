import { invoke } from "@tauri-apps/api/core";

let currentShortcutItem: HTMLElement | null = null;
let capturedKey: string | null = null;

async function loadMaps() {
  const maps = await invoke<Array<MapDto>>("get_maps");
  const container = document.getElementById("carouselTrack");
  if (!container) return;

  maps.forEach((map, idx) => {
    const div = document.createElement("div");
    const classMap = idx === 0 ? "carousel-item active" : "carousel-item";
    div.innerHTML = `
      <a href="#" class="${classMap}" data-map-id="${map.id}" onclick="onMapClick(${map.id})">
          <div class="icon">
              <img src="${map.imagePath}">
          </div>
          <div class="text">${map.name}</div>
      </a>
    `;
    container.appendChild(div);
  });

  const firstMap = maps.length > 0 ? maps[0] : null;
  if (firstMap) {
    onMapClick(firstMap.id);
  }
}

async function onMapClick(id: number) {
  // Remove 'active' de todos os itens
  const items = document.querySelectorAll('.carousel-item');
  items.forEach(item => item.classList.remove('active'));

  // Adiciona 'active' ao item clicado
  const clicked = document.querySelector(`.carousel-item[data-map-id="${id}"]`);
  if (clicked) {
    clicked.classList.add('active');
  }

  loadShortcutsByMap(id);
}

function openShortcutPopup(item: HTMLElement) {
  currentShortcutItem = item;
  capturedKey = null;
  (document.getElementById("capturedKey") as HTMLElement).textContent = "...";
  document.getElementById("shortcutPopup")?.classList.remove("hidden");

  document.addEventListener("keydown", captureKey, { once: false });
}

function captureKey(e: KeyboardEvent) {
  e.preventDefault();
  capturedKey = formatKey(e);
  (document.getElementById("capturedKey") as HTMLElement).textContent =
    capturedKey;
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
      currentShortcutItem?.querySelector(
        ".shortcut-description"
      ) as HTMLTextAreaElement
    )?.value ?? "";

    const activeMap = document.querySelector(
      ".carousel-item.active"
    ) as HTMLElement;

    const mapId = activeMap ? parseInt(activeMap.dataset.mapId) : 0;
    if (!mapId) {
      await invoke("log_message", { message: "No active map selected." });
      return;
    }

    let shortcutId = parseInt(currentShortcutItem?.dataset?.id) ?? null;

    await invoke("log_message", { message: `Map ${mapId}, shortcut ${shortcutId}, key ${captureKey}` });
    try {
      shortcutId = await invoke<number>("save_shortcut", {
        mapId,
        shortcut: capturedKey,
        description: description,
        id: shortcutId
      });
    } catch (error) {
      await invoke("log_message", { message: "Error saving shortcut " + error });
      return;
    }      
    
    // exists
    if (currentShortcutItem) {
      const input = currentShortcutItem.querySelector(
        ".shortcut-key.ac"
      ) as HTMLInputElement;
      input.value = capturedKey;
      currentShortcutItem = null;
    }else {
      (window as any).shortcutManager.addShortcut(shortcutId, capturedKey, '', true);
    }


    document.getElementById("shortcutPopup")?.classList.add("hidden");
  });

  cancelBtn?.addEventListener("click", () => {
    document.getElementById("shortcutPopup")?.classList.add("hidden");
  });
}

function loadShortcutsByMap(mapId: number) {
  invoke<Array<ShortcutDto>>("list_shortcuts_by_map", { mapId })
    .then(shortcuts => {
      (window as any).shortcutManager.setShortcuts(shortcuts);
    })
    .catch(async (error) => {
      await invoke("log_message", { message: "Error loading shortcuts: " + error });
    });
}

function removeShortcut() {
    if (this.activeShortcut) {
        const itemsCount = this.shortcutList.querySelectorAll('.shortcut-item').length;
        
        if (itemsCount > 1) {
            const nextItem = this.activeShortcut.nextElementSibling || 
                            this.activeShortcut.previousElementSibling;
            
            this.activeShortcut.remove();
            
            if (nextItem) {
                this.setActiveShortcut(nextItem);
            }
        } else {
            this.removeBtn.disabled = true;
        }
    }
}

// usado pelo botão ✏️ no HTML
(window as any).editShortcut = (button: HTMLElement) => {
  const item = button.closest(".shortcut-item") as HTMLElement;
  openShortcutPopup(item);
};

(window as any).addShortcut = () => {
  openShortcutPopup(null as any);
}

document.addEventListener("DOMContentLoaded", () => {
  initShortcutPopup();
});

(window as any).onMapClick = onMapClick;
(window as any).loadShortcutsByMap = loadShortcutsByMap

loadMaps();