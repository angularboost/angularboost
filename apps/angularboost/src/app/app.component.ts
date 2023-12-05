import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [],
  // We can use <custom-element-example> only if we turn off error-checking...
  // schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'angularboost-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor() {
    // Register the custom element
    customElements.define(
      'my-custom-element-with-prefix',
      CustomElementExample
    );
  }
}

// Define a custom element
class CustomElementExample extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const span = document.createElement('span');
    span.textContent = `I'm a Custom Element!`;
    shadowRoot.appendChild(span);
  }
}
