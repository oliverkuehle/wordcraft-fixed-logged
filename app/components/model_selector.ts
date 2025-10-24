/**
 * Simple floating model selector: three buttons fixed bottom-left that
 * read/write the selected model from `app/state.ts`.
 */
import {MobxLitElement} from '@adobe/lit-mobx';
import {html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {styles} from './model_selector.css';
import {getSelectedModel, setSelectedModel} from '../state';

@customElement('wordcraft-model-selector')
export class ModelSelector extends MobxLitElement {
  static override get styles() {
    return [styles];
  }

  @property({type: String}) selectedModel: string | null = null;

  private readonly options = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];

  override connectedCallback() {
    super.connectedCallback();
    // Initialize from state
    try {
      const val = getSelectedModel();
      this.selectedModel = val;
    } catch (e) {
      // ignore
    }
  }

  private onClick(option: string) {
    setSelectedModel(option);
    this.selectedModel = option;
  }

  override render() {
    return html`
      <div class="selector" role="group" aria-label="Model selector">
        ${this.options.map(
          (opt) => html`
            <button
              type="button"
              class=${this.selectedModel === opt ? 'selected' : ''}
              @click=${() => this.onClick(opt)}
              aria-pressed=${this.selectedModel === opt}
            >
              ${opt}
            </button>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wordcraft-model-selector': ModelSelector;
  }
}
