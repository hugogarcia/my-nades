// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.themeToggle = document.getElementById('themeToggle');
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateToggleButton(theme);
    }

    updateToggleButton(theme) {
        if (theme === 'dark') {
            this.themeToggle.innerHTML = '☀️ Light';
        } else {
            this.themeToggle.innerHTML = '🌙 Dark';
        }
    }
}

// Menu Management
class MenuManager {
    constructor() {
        this.menuButton = document.getElementById('menuButton');
        this.sideMenu = document.getElementById('sideMenu');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.isOpen = false;
        this.init();
    }

    init() {
        this.menuButton.addEventListener('click', this.toggleMenu.bind(this));
        this.menuOverlay.addEventListener('click', this.closeMenu.bind(this));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isOpen = true;
        this.sideMenu.classList.add('open');
        this.menuOverlay.classList.add('active');
        this.menuButton.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.isOpen = false;
        this.sideMenu.classList.remove('open');
        this.menuOverlay.classList.remove('active');
        this.menuButton.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Shortcut Management
class ShortcutManager {
    constructor() {
        this.shortcuts = [];
        this.activeShortcut = null;
        this.nextId = 3;
        this.shortcutList = document.getElementById('shortcutList');
        this.addBtn = document.getElementById('addShortcut');
        this.removeBtn = document.getElementById('removeShortcut');
        this.init();
    }

    init() {
        //this.addBtn.addEventListener('click', this.addShortcut.bind(this));
        this.removeBtn.addEventListener('click', this.removeShortcut.bind(this));

        this.attachEventListeners();
        
        this.setActiveShortcut(document.querySelector('.shortcut-item[data-id="0"]'));
    }

    attachEventListeners() {
        const items = this.shortcutList.querySelectorAll('.shortcut-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.matches('input, textarea, button')) {
                    this.setActiveShortcut(item);
                }
            });

            const inputs = item.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    this.setActiveShortcut(item);
                });
            });
        });
    }

    setActiveShortcut(item) {
        this.shortcutList.querySelectorAll('.shortcut-item').forEach(i => {
            i.classList.remove('active');
        });

        item.classList.add('active');
        this.activeShortcut = item;

        this.removeBtn.disabled = false;
    }

    addShortcut(shortcutId, captureKey) {
        const newItem = document.createElement('div');
        newItem.className = 'shortcut-item';
        newItem.dataset.id = shortcutId.toString();
        
        newItem.innerHTML = `
            <div class="shortcut-key-container">
                <input type="text" class="shortcut-key" value="${captureKey}" placeholder="Atalho" readonly>
                <button class="edit-btn" onclick="editShortcut(this)">✏️</button>
            </div>
            <textarea class="shortcut-description" placeholder="Descrição do atalho"></textarea>
        `;

        this.shortcutList.appendChild(newItem);
        
        this.attachEventListenersToItem(newItem);
        
        this.setActiveShortcut(newItem);
        newItem.querySelector('.shortcut-description').focus();
    }

    removeShortcut() {
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

    attachEventListenersToItem(item) {
        item.addEventListener('click', (e) => {
            if (!e.target.matches('input, textarea, button')) {
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

class HorizontalCarousel {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.carousel-track');
        this.leftArrow = container.querySelector('.carousel-arrow.left');
        this.rightArrow = container.querySelector('.carousel-arrow.right');
        this.isDragging = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;
        
        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));

        this.leftArrow.addEventListener('click', this.scrollLeftArrow.bind(this));
        this.rightArrow.addEventListener('click', this.scrollRightArrow.bind(this));

        this.container.addEventListener('dragstart', (e) => e.preventDefault());

        window.addEventListener('resize', this.updateArrows.bind(this));
        
        setTimeout(() => this.updateArrows(), 100);
    }

    scrollLeftArrow() {
        const containerWidth = this.container.querySelector('.carousel-track-wrapper').offsetWidth;
        const currentTranslate = this.getCurrentTranslateX();
        const newTranslate = currentTranslate + containerWidth * 0.7;
        
        this.track.style.transition = 'transform 0.4s ease';
        this.setTranslateX(this.constrainTranslate(newTranslate));
        
        setTimeout(() => this.updateArrows(), 400);
    }

    scrollRightArrow() {
        const containerWidth = this.container.querySelector('.carousel-track-wrapper').offsetWidth;
        const currentTranslate = this.getCurrentTranslateX();
        const newTranslate = currentTranslate - containerWidth * 0.7;
        
        this.track.style.transition = 'transform 0.4s ease';
        this.setTranslateX(this.constrainTranslate(newTranslate));
        
        setTimeout(() => this.updateArrows(), 400);
    }

    updateArrows() {
        const containerWidth = this.container.querySelector('.carousel-track-wrapper').offsetWidth;
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

    handleMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startX = e.pageX - this.container.offsetLeft;
        this.scrollLeft = this.getCurrentTranslateX();
        this.lastX = e.pageX;
        this.lastTime = Date.now();
        this.velocity = 0;
        
        this.track.style.transition = 'none';
    }

    handleMouseMove(e) {
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

    handleMouseUp() {
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

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.isDragging = true;
        this.startX = touch.pageX - this.container.offsetLeft;
        this.scrollLeft = this.getCurrentTranslateX();
        this.track.style.transition = 'none';
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const x = touch.pageX - this.container.offsetLeft;
        const walk = (x - this.startX) * 1;
        const newTranslateX = this.scrollLeft + walk;
        
        this.setTranslateX(this.constrainTranslate(newTranslateX));
        this.updateArrows();
    }

    handleTouchEnd() {
        this.isDragging = false;
        this.track.style.transition = 'transform 0.3s ease';
        setTimeout(() => this.updateArrows(), 300);
    }

    getCurrentTranslateX() {
        const style = window.getComputedStyle(this.track);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41 || 0;
    }

    setTranslateX(x) {
        this.track.style.transform = `translateX(${x}px)`;
    }

    constrainTranslate(translateX) {
        const containerWidth = this.container.querySelector('.carousel-track-wrapper').offsetWidth;
        const trackWidth = this.track.scrollWidth;
        const maxTranslate = 0;
        const minTranslate = Math.min(0, containerWidth - trackWidth);
        
        return Math.max(minTranslate, Math.min(maxTranslate, translateX));
    }
}

// Funções para gerenciamento de mídia
function addMedia(slotIndex) {
    alert(`Adicionar mídia no slot ${slotIndex + 1}`);
}

function removeMedia(slotIndex) {
    alert(`Remover mídia do slot ${slotIndex + 1}`);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const themeManager = new ThemeManager();
    const menuManager = new MenuManager();
    const carousel = document.getElementById('carousel');
    new HorizontalCarousel(carousel);
    const shortcutManager = new ShortcutManager();
    window.shortcutManager = shortcutManager;
});