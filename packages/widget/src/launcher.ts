import type { WidgetConfig } from '@echo/shared/types';

const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  theme: 'auto',
  position: 'bottom-right',
  primaryColor: '#4F46E5',
  brandName: 'Echo Support',
  welcomeMessage: 'Hi! How can we help you today?',
  placeholder: 'Type your message...',
  showBranding: true,
  allowFileUpload: false,
  maxFileSize: 10 * 1024 * 1024,
};

export class WidgetLauncher {
  private config: WidgetConfig;
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private isOpen = false;

  constructor(config: Partial<WidgetConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config } as WidgetConfig;
    this.mount();
  }

  private mount(): void {
    this.container = document.createElement('div');
    this.container.id = 'echo-widget-container';
    this.container.style.cssText = this.getContainerStyles();

    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    const button = this.createLauncherButton();
    this.shadowRoot.appendChild(button);

    document.body.appendChild(this.container);
  }

  private createLauncherButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'echo-launcher';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = this.getChatIcon();

    button.addEventListener('click', () => this.toggle());

    return button;
  }

  private toggle(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.openWidget();
    } else {
      this.closeWidget();
    }
  }

  private openWidget(): void {
    const widget = document.createElement('div');
    widget.className = 'echo-widget';
    widget.id = 'echo-widget-frame';

    const iframe = document.createElement('iframe');
    iframe.src = `/widget?tenant=${this.config.tenantId}&theme=${this.config.theme}`;
    iframe.style.cssText = 'width:100%;height:100%;border:0;';
    iframe.title = 'Echo Chat Widget';

    widget.appendChild(iframe);
    this.shadowRoot?.appendChild(widget);

    const launcher = this.shadowRoot?.querySelector('.echo-launcher') as HTMLButtonElement;
    if (launcher) {
      launcher.innerHTML = this.getCloseIcon();
      launcher.setAttribute('aria-label', 'Close chat');
    }
  }

  private closeWidget(): void {
    const widget = this.shadowRoot?.querySelector('#echo-widget-frame');
    widget?.remove();

    const launcher = this.shadowRoot?.querySelector('.echo-launcher') as HTMLButtonElement;
    if (launcher) {
      launcher.innerHTML = this.getChatIcon();
      launcher.setAttribute('aria-label', 'Open chat');
    }
  }

  private getContainerStyles(): string {
    const position = this.config.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;';
    return `
      position: fixed;
      bottom: 20px;
      ${position}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;
  }

  private getStyles(): string {
    return `
      .echo-launcher {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        color: white;
      }

      .echo-launcher:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .echo-launcher:active {
        transform: scale(0.95);
      }

      .echo-launcher svg {
        width: 28px;
        height: 28px;
      }

      .echo-widget {
        position: fixed;
        bottom: 90px;
        ${this.config.position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        background: white;
        overflow: hidden;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .echo-widget {
          width: calc(100vw - 40px);
          height: calc(100vh - 120px);
          bottom: 90px;
          right: 20px;
          left: 20px;
        }
      }
    `;
  }

  private getChatIcon(): string {
    return `
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;
  }

  private getCloseIcon(): string {
    return `
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.shadowRoot = null;
  }
}
