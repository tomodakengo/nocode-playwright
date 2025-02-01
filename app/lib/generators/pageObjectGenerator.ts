import { PageObjectData, Selector } from '../types/pageObject';

export class PageObjectGenerator {
    static generateTypeScript(pageObject: PageObjectData): string {
        const className = this.formatClassName(pageObject.name);
        const selectors = this.generateSelectors(pageObject.selectors);
        const methods = this.generateMethods(pageObject.selectors);

        return `
import { Page } from '@playwright/test';

export class ${className} {
  constructor(private page: Page) {}

  // Selectors
${selectors}

  // Methods
${methods}

  async goto() {
    await this.page.goto('${pageObject.url}');
  }
}`;
    }

    private static formatClassName(name: string): string {
        return name
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Page';
    }

    private static generateSelectors(selectors: Selector[]): string {
        return selectors
            .map(selector => {
                const selectorType = selector.type === 'xpath' ? 'xpath=' : '';
                return `  private ${selector.name}Selector = '${selectorType}${selector.value}';`;
            })
            .join('\n');
    }

    private static generateMethods(selectors: Selector[]): string {
        return selectors
            .map(selector => {
                const methodName = selector.name.charAt(0).toLowerCase() + selector.name.slice(1);
                return `
  async ${methodName}() {
    return this.page.locator(this.${selector.name}Selector);
  }

  async click${selector.name}() {
    const element = await this.${methodName}();
    await element.click();
  }

  async fill${selector.name}(value: string) {
    const element = await this.${methodName}();
    await element.fill(value);
  }`;
            })
            .join('\n');
    }
} 