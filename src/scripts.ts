// Theme Management
export class ThemeManager {
    private currentTheme: 'light' | 'dark';
    private themeToggle: HTMLButtonElement;

    constructor() {
        this.currentTheme = 'dark';
        this.themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
        this.init();
    }

    private init(): void {
        this.applyTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    private toggleTheme(): void {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
    }

    private applyTheme(theme: 'light' | 'dark'): void {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateToggleButton(theme);
    }

    private updateToggleButton(theme: 'light' | 'dark'): void {
        if (theme === 'dark') {
            this.themeToggle.innerHTML = '☀️ Light';
        } else {
            this.themeToggle.innerHTML = '🌙 Dark';
        }
    }
}

// Menu Management
export class MenuManager {
    private menuButton: HTMLButtonElement;
    private sideMenu: HTMLElement;
    private menuOverlay: HTMLElement;
    private isOpen: boolean;

    constructor() {
        this.menuButton = document.getElementById('menuButton') as HTMLButtonElement;
        this.sideMenu = document.getElementById('sideMenu') as HTMLElement;
        this.menuOverlay = document.getElementById('menuOverlay') as HTMLElement;
        this.isOpen = false;
        this.init();
    }

    private init(): void {
        this.menuButton.addEventListener('click', this.toggleMenu.bind(this));
        this.menuOverlay.addEventListener('click', this.closeMenu.bind(this));
        
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    private toggleMenu(): void {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    private openMenu(): void {
        this.isOpen = true;
        this.sideMenu.classList.add('open');
        this.menuOverlay.classList.add('active');
        this.menuButton.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    private closeMenu(): void {
        this.isOpen = false;
        this.sideMenu.classList.remove('open');
        this.menuOverlay.classList.remove('active');
        this.menuButton.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Shortcut Management
export class ShortcutManager {
    private activeShortcut: HTMLElement | null;
    private nextId: number;
    private shortcutList: HTMLElement;
    private addBtn: HTMLButtonElement;
    private removeBtn: HTMLButtonElement;

    constructor() {
        this.activeShortcut = null;
        this.nextId = 3;
        this.shortcutList = document.getElementById('shortcutList') as HTMLElement;
        this.addBtn = document.getElementById('addShortcut') as HTMLButtonElement;
        this.removeBtn = document.getElementById('removeShortcut') as HTMLButtonElement;
        this.init();
    }

    private init(): void {
        this.removeBtn.addEventListener('click', this.removeShortcut.bind(this));
        this.attachEventListeners();
        
        const firstItem = document.querySelector('.shortcut-item[data-id="0"]') as HTMLElement;
        if (firstItem) {
            this.setActiveShortcut(firstItem);
        }
    }

    public setShortcuts(newShortcuts: ShortcutDto[]): void {
        this.shortcutList.innerHTML = "";

        newShortcuts.forEach((s) => {            
            this.addShortcut(s.id, s.shortcut, s.description, false);
        });

        const firstItem = this.shortcutList.querySelector('.shortcut-item') as HTMLElement;
        if (firstItem) {
            this.setActiveShortcut(firstItem);
        }
    }

    private attachEventListeners(): void {
        const items = this.shortcutList.querySelectorAll('.shortcut-item');
        items.forEach(item => {
            const htmlItem = item as HTMLElement;
            htmlItem.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLElement;
                if (!target.matches('input, textarea, button')) {
                    this.setActiveShortcut(htmlItem);
                }
            });

            const inputs = htmlItem.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    this.setActiveShortcut(htmlItem);
                });
            });
        });
    }

    public setActiveShortcut(item: HTMLElement): void {
        this.shortcutList.querySelectorAll('.shortcut-item').forEach(i => {
            i.classList.remove('active');
        });

        item.classList.add('active');
        this.activeShortcut = item;
        this.removeBtn.disabled = false;
    }

    public addShortcut(shortcutId: number, captureKey: string, description: string, setActive: boolean = false): void {
        const newItem = document.createElement('div');
        newItem.className = 'shortcut-item';
        newItem.dataset.id = shortcutId.toString();
        
        newItem.innerHTML = `
            <div class="shortcut-key-container">
                <input type="text" class="shortcut-key" value="${captureKey}" placeholder="Atalho" readonly>
                <button class="edit-btn" onclick="editShortcut(this)">✏️</button>
            </div>
            <textarea class="shortcut-description" placeholder="Descrição do atalho">${description}</textarea>
        `;

        this.shortcutList.appendChild(newItem);
        this.attachEventListenersToItem(newItem);
        
        if (setActive) {
            this.setActiveShortcut(newItem);
        }

        const textarea = newItem.querySelector('.shortcut-description') as HTMLTextAreaElement;
        textarea.focus();
    }

    private removeShortcut(): void {
        if (this.activeShortcut) {
            const itemsCount = this.shortcutList.querySelectorAll('.shortcut-item').length;
            
            if (itemsCount > 1) {
                const nextItem = (this.activeShortcut.nextElementSibling || 
                                 this.activeShortcut.previousElementSibling) as HTMLElement;
                
                this.activeShortcut.remove();
                
                if (nextItem) {
                    this.setActiveShortcut(nextItem);
                }
            } else {
                this.removeBtn.disabled = true;
            }
        }
    }

    private attachEventListenersToItem(item: HTMLElement): void {
        item.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (!target.matches('input, textarea, button')) {
                this.setActiveShortcut(item);
            }
        });

        const inputs = item.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.setActiveShortcut(item);
            });
        });
    }
}

export class HorizontalCarousel {
    private container: HTMLElement;
    private track: HTMLElement;
    private leftArrow: HTMLElement;
    private rightArrow: HTMLElement;
    private isDragging: boolean;
    private startX: number;
    private scrollLeft: number;
    private velocity: number;
    private lastX: number;
    private lastTime: number;

    constructor(container: HTMLElement) {
        this.container = container;
        this.track = container.querySelector('.carousel-track') as HTMLElement;
        this.leftArrow = container.querySelector('.carousel-arrow.left') as HTMLElement;
        this.rightArrow = container.querySelector('.carousel-arrow.right') as HTMLElement;
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;
        
        this.init();
    }

    private init(): void {
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));

        this.leftArrow.addEventListener('click', this.scrollLeftArrow.bind(this));
        this.rightArrow.addEventListener('click', this.scrollRightArrow.bind(this));

        this.container.addEventListener('dragstart', (e: Event) => e.preventDefault());

        window.addEventListener('resize', this.updateArrows.bind(this));
        
        setTimeout(() => this.updateArrows(), 100);
    }

    private scrollLeftArrow(): void {
        const wrapper = this.container.querySelector('.carousel-track-wrapper') as HTMLElement;
        const containerWidth = wrapper.offsetWidth;
        const currentTranslate = this.getCurrentTranslateX();
        const newTranslate = currentTranslate + containerWidth * 0.7;
        
        this.track.style.transition = 'transform 0.4s ease';
        this.setTranslateX(this.constrainTranslate(newTranslate));
        
        setTimeout(() => this.updateArrows(), 400);
    }

    private scrollRightArrow(): void {
        const wrapper = this.container.querySelector('.carousel-track-wrapper') as HTMLElement;
        const containerWidth = wrapper.offsetWidth;
        const currentTranslate = this.getCurrentTranslateX();
        const newTranslate = currentTranslate - containerWidth * 0.7;
        
        this.track.style.transition = 'transform 0.4s ease';
        this.setTranslateX(this.constrainTranslate(newTranslate));
        
        setTimeout(() => this.updateArrows(), 400);
    }

    private updateArrows(): void {
        const wrapper = this.container.querySelector('.carousel-track-wrapper') as HTMLElement;
        const containerWidth = wrapper.offsetWidth;
        const trackWidth = this.track.scrollWidth;
        const currentTranslate = this.getCurrentTranslateX();
        
        if (currentTranslate >= 0) {
            this.leftArrow.classList.remove('visible');
        } else {
            this.leftArrow.classList.add('visible');
        }
        
        const maxTranslate = Math.min(0, containerWidth - trackWidth);
        if (currentTranslate <= maxTranslate + 5) {
            this.rightArrow.classList.remove('visible');
        } else {
            this.rightArrow.classList.add('visible');
        }
    }

    private handleMouseDown(e: MouseEvent): void {
        e.preventDefault();
        this.isDragging = true;
        this.startX = e.pageX - this.container.offsetLeft;
        this.scrollLeft = this.getCurrentTranslateX();
        this.lastX = e.pageX;
        this.lastTime = Date.now();
        this.velocity = 0;
        
        this.track.style.transition = 'none';
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;
        
        e.preventDefault();
        const x = e.pageX - this.container.offsetLeft;
        const walk = (x - this.startX) * 1;
        const newTranslateX = this.scrollLeft + walk;
        
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastTime;
        if (timeDelta > 0) {
            this.velocity = (e.pageX - this.lastX) / timeDelta;
        }
        this.lastX = e.pageX;
        this.lastTime = currentTime;
        
        this.setTranslateX(this.constrainTranslate(newTranslateX));
        this.updateArrows();
    }

    private handleMouseUp(): void {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        this.track.style.transition = 'transform 0.3s ease';
        
        if (Math.abs(this.velocity) > 0.5) {
            const momentum = this.velocity * 200;
            const currentTranslate = this.getCurrentTranslateX();
            const newTranslate = currentTranslate + momentum;
            this.setTranslateX(this.constrainTranslate(newTranslate));
        }
        
        setTimeout(() => this.updateArrows(), 300);
    }

    private handleTouchStart(e: TouchEvent): void {
        const touch = e.touches[0];
        this.isDragging = true;
        this.startX = touch.pageX - this.container.offsetLeft;
        this.scrollLeft = this.getCurrentTranslateX();
        this.track.style.transition = 'none';
    }

    private handleTouchMove(e: TouchEvent): void {
        if (!this.isDragging) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.pageX - this.container.offsetLeft;
        const walk = (x - this.startX) * 1;
        const newTranslateX = this.scrollLeft + walk;
        
        this.setTranslateX(this.constrainTranslate(newTranslateX));
        this.updateArrows();
    }

    private handleTouchEnd(): void {
        this.isDragging = false;
        this.track.style.transition = 'transform 0.3s ease';
        setTimeout(() => this.updateArrows(), 300);
    }

    private getCurrentTranslateX(): number {
        const style = window.getComputedStyle(this.track);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41 || 0;
    }

    private setTranslateX(x: number): void {
        this.track.style.transform = `translateX(${x}px)`;
    }

    private constrainTranslate(translateX: number): number {
        const wrapper = this.container.querySelector('.carousel-track-wrapper') as HTMLElement;
        const containerWidth = wrapper.offsetWidth;
        const trackWidth = this.track.scrollWidth;
        const maxTranslate = 0;
        const minTranslate = Math.min(0, containerWidth - trackWidth);
        
        return Math.max(minTranslate, Math.min(maxTranslate, translateX));
    }
}

// Funções para gerenciamento de mídia
export function addMedia(slotIndex: number): void {
    alert(`Adicionar mídia no slot ${slotIndex + 1}`);
}

export function removeMedia(slotIndex: number): void {
    alert(`Remover mídia do slot ${slotIndex + 1}`);
}