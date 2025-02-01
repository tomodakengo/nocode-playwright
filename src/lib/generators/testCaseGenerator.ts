import { TestCaseData, TestStep } from '../types/pageObject';

export class TestCaseGenerator {
    static generateTypeScript(testCase: TestCaseData, pageObjectImports: string[]): string {
        const imports = this.generateImports(pageObjectImports);
        const steps = this.generateSteps(testCase.steps);

        return `
import { test, expect } from '@playwright/test';
${imports}

test('${testCase.name}', async ({ page }) => {
  ${testCase.description ? `// ${testCase.description}\n  ` : ''}${steps}
});`;
    }

    private static generateImports(pageObjects: string[]): string {
        return pageObjects
            .map(po => `import { ${po} } from '../pages/${po}';`)
            .join('\n');
    }

    private static generateSteps(steps: TestStep[]): string {
        return steps
            .map(step => {
                switch (step.action) {
                    case 'navigate':
                        return `await page.goto('${step.value}');`;
                    case 'click':
                        return `await page.click('${step.selector}');`;
                    case 'type':
                        return `await page.fill('${step.selector}', '${step.value}');`;
                    case 'assert':
                        return `await expect(page.locator('${step.selector}')).toHaveText('${step.value}');`;
                    case 'wait':
                        return `await page.waitForSelector('${step.selector}');`;
                    default:
                        return '';
                }
            })
            .filter(Boolean)
            .join('\n  ');
    }
} 