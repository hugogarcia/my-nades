import { invoke } from "@tauri-apps/api/core";

async function loadMaps() {
  const maps = await invoke<Array<[number, string, string]>>("get_maps");
  const container = document.getElementById("carouselTrack");
  if (!container) return;

  maps.forEach(([id, name, path]) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <a href="#" class="carousel-item" onclick="onMapClick(${id})">
          <div class="icon">
              <img src="${path}">
          </div>
          <div class="text">${name}</div>
      </a>
    `;
    container.appendChild(div);
  });
}

async function onMapClick(id: number) {
  console.log("Map clicked:", id);
}

loadMaps();