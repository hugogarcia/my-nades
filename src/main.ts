import { invoke } from "@tauri-apps/api/core";

async function loadMaps() {
  const maps = await invoke<Array<[number, string, string]>>("get_maps");
  const container = document.getElementById("map-carousel");
  if (!container) return;

  console.log(maps);
  maps.forEach(([_, name, path]) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <img src="src/${path}" alt="${name}" />
      <p>${name}</p>
    `;
    container.appendChild(div);
  });
}

loadMaps();