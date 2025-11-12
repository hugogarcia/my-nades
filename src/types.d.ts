interface MapDto {
    id: number;
    name: string;
    imagePath: string;
}

interface ShortcutDto {
    id: number;
    mapId: number;
    description: string;
    shortcut: string;
}