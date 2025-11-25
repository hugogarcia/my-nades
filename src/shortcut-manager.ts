import { invoke } from "@tauri-apps/api/core";
import { logMessage } from "./logger";
import { notify } from "./notify";

// Variável para controlar o debounce
let descriptionSaveTimeout: number | null = null;

export class ShortcutManager {
  private activeShortcut: HTMLElement | null;
  private shortcutList: HTMLElement;
  private removeBtn: HTMLButtonElement;

  constructor() {
    this.activeShortcut = null;
    this.shortcutList = document.getElementById("shortcutList") as HTMLElement;
    this.removeBtn = document.getElementById(
      "removeShortcut"
    ) as HTMLButtonElement;
    this.init();
  }

  private init(): void {
    this.removeBtn.addEventListener("click", async () => {
      try {
        await this.removeShortcut();
      } catch (error) {
        logMessage(`Erro ao remover: ${error}`);
      }
    });
    this.attachEventListeners();

    const firstItem = document.querySelector(
      '.shortcut-item[data-id="0"]'
    ) as HTMLElement;
    if (firstItem) {
      this.setActiveShortcut(firstItem);
    }
  }

  public setShortcuts(newShortcuts: ShortcutDto[]): void {
    this.shortcutList.innerHTML = "";

    newShortcuts.forEach((s) => {
      this.addShortcut(s, false);
    });

    const firstItem = this.shortcutList.querySelector(
      ".shortcut-item"
    ) as HTMLElement;
    if (firstItem) {
      this.setActiveShortcut(firstItem);
    }
  }

  private attachEventListeners(): void {
    const items = this.shortcutList.querySelectorAll(".shortcut-item");
    items.forEach((item) => {
      const htmlItem = item as HTMLElement;
      htmlItem.addEventListener("click", (e: Event) => {
        const target = e.target as HTMLElement;
        if (!target.matches("input, textarea, button")) {
          this.setActiveShortcut(htmlItem);
        }
      });

      const inputs = htmlItem.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        input.addEventListener("focus", () => {
          this.setActiveShortcut(htmlItem);
        });
      });
    });
  }

  public setActiveShortcut(item: HTMLElement): void {
    this.shortcutList.querySelectorAll(".shortcut-item").forEach((i) => {
      i.classList.remove("active");
    });

    item.classList.add("active");
    this.activeShortcut = item;
    this.removeBtn.disabled = false;
  }

  public addShortcut(shortcut: ShortcutDto, setActive: boolean = false): void {
    const newItem = document.createElement("div");
    newItem.className = "shortcut-item";
    newItem.dataset.id = shortcut.id.toString();
    newItem.dataset.mapId = shortcut.mapId.toString();

    newItem.innerHTML = `
      <div class="shortcut-key-container">
        <input type="text" class="shortcut-key" value="${shortcut.shortcut}" placeholder="Atalho" readonly>
        <button class="edit-btn" onclick="editShortcut(this)">✏️</button>
      </div>
      <textarea class="shortcut-description" placeholder="Descrição do atalho">${shortcut.description}</textarea>
    `;

    this.shortcutList.appendChild(newItem);
    this.attachEventListenersToItem(newItem);

    // Adiciona auto-save no textarea
    const textarea = newItem.querySelector(
      ".shortcut-description"
    ) as HTMLTextAreaElement;
    this.attachDescriptionAutoSave(textarea);

    if (setActive) {
      this.setActiveShortcut(newItem);
      textarea.focus();
    }
  }

  // Método para adicionar auto-save em um textarea específico
  private attachDescriptionAutoSave(textarea: HTMLTextAreaElement): void {
    // Salva após 1 segundo sem digitar
    textarea.addEventListener("input", () => {
      if (descriptionSaveTimeout !== null) {
        clearTimeout(descriptionSaveTimeout);
      }

      descriptionSaveTimeout = window.setTimeout(() => {
        this.saveShortcutDescription(textarea);
      }, 1000); // 1 segundo de delay
    });

    // Salva imediatamente ao perder o foco
    textarea.addEventListener("blur", () => {
      // Cancela o timeout se existir
      if (descriptionSaveTimeout !== null) {
        clearTimeout(descriptionSaveTimeout);
        descriptionSaveTimeout = null;
      }

      // Salva imediatamente
      this.saveShortcutDescription(textarea);
    });
  }

  // Método para salvar a descrição
  private async saveShortcutDescription(
    textarea: HTMLTextAreaElement
  ): Promise<void> {
    const shortcutItem = textarea.closest(".shortcut-item") as HTMLElement;
    if (!shortcutItem) return;

    const shortcutId = parseInt(shortcutItem.dataset.id ?? "0");
    const mapId = parseInt(shortcutItem.dataset.mapId ?? "0");
    if (!shortcutId || !mapId) return;

    const description = textarea.value;
    const shortcutKey =
      (shortcutItem.querySelector(".shortcut-key") as HTMLInputElement)
        ?.value ?? "";

    try {
      // Feedback visual: borda verde temporária
      textarea.style.borderColor = "#28a745";

      await invoke("save_shortcut", {
        mapId,
        shortcut: shortcutKey,
        description: description,
        id: shortcutId,
      });

      // Remove feedback após 500ms
      setTimeout(() => {
        textarea.style.borderColor = "";
      }, 500);
    } catch (error) {
      textarea.style.borderColor = "#dc3545";
      notify.error("Erro ao salvar descrição do atalho. Tente novamente.");

      setTimeout(() => {
        textarea.style.borderColor = "";
      }, 1000);
    }
  }

  public async removeShortcut(): Promise<void> {
    if (this.activeShortcut) {
      const id = this.activeShortcut.dataset.id;
      const mapId = this.activeShortcut.dataset.mapId;

      await invoke("delete_shortcut", {
        mapId: parseInt(mapId || "0"),
        shortcutId: parseInt(id || "0"),
      });

      const itemsCount =
        this.shortcutList.querySelectorAll(".shortcut-item").length;

      if (itemsCount > 1) {
        const nextItem = (this.activeShortcut.nextElementSibling ||
          this.activeShortcut.previousElementSibling) as HTMLElement;

        this.activeShortcut.remove();
        if (nextItem) {
          this.setActiveShortcut(nextItem);
        }
      } else {
        this.removeBtn.disabled = true;
        this.activeShortcut.remove();
        this.activeShortcut = null;
      }
    }
  }

  private attachEventListenersToItem(item: HTMLElement): void {
    item.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.matches("input, textarea, button")) {
        this.setActiveShortcut(item);
      }
    });

    const inputs = item.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        this.setActiveShortcut(item);
      });
    });
  }
}
