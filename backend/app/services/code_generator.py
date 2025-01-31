from typing import Dict, List
from jinja2 import Environment, PackageLoader, select_autoescape
import os
import re

class PlaywrightCodeGenerator:
    def __init__(self):
        self.env = Environment(
            loader=PackageLoader('app', 'templates'),
            autoescape=select_autoescape(['html', 'xml'])
        )

    def generate_page_object(self, page_data: Dict) -> str:
        """Generate Page Object class from page data"""
        template = self.env.get_template('page_object.py.jinja2')
        
        # Convert page name to class name
        class_name = self._to_class_name(page_data["name"])
        
        return template.render(
            class_name=class_name,
            url_pattern=page_data["url_pattern"],
            selectors=page_data["selectors"]
        )

    def generate_test_file(self, test_suite_data: Dict) -> str:
        """Generate test file from test suite data"""
        template = self.env.get_template('test_file.py.jinja2')
        
        # Convert test suite name to file name
        file_name = self._to_file_name(test_suite_data["name"])
        
        return template.render(
            test_suite_name=test_suite_data["name"],
            test_cases=test_suite_data["test_cases"],
            configuration=test_suite_data["configuration"]
        )

    def _to_class_name(self, name: str) -> str:
        """Convert string to PascalCase class name"""
        # Remove special characters and split
        words = re.findall(r'[A-Za-z0-9]+', name)
        # Capitalize each word and join
        return ''.join(word.capitalize() for word in words)

    def _to_file_name(self, name: str) -> str:
        """Convert string to snake_case file name"""
        # Remove special characters and convert spaces to underscores
        name = re.sub(r'[^A-Za-z0-9\s]', '', name)
        name = name.replace(' ', '_')
        # Convert to lowercase
        return name.lower()

    def generate_step_code(self, step: Dict) -> str:
        """Generate code for a single test step"""
        action = step["action"]
        selector = step["selector"]
        value = step.get("value")

        if action == "click":
            return f'await page.click("{selector}")'
        elif action == "type":
            return f'await page.fill("{selector}", "{value}")'
        elif action == "select":
            return f'await page.selectOption("{selector}", "{value}")'
        elif action == "hover":
            return f'await page.hover("{selector}")'
        elif action == "wait":
            return f'await page.waitForSelector("{selector}")'
        elif action == "assert":
            return f'expect(await page.isVisible("{selector}")).toBeTruthy()'
        else:
            raise ValueError(f"Unknown action: {action}")

    def create_project_structure(self, base_dir: str) -> None:
        """Create the basic project structure for Playwright tests"""
        directories = [
            "tests",
            "tests/pages",
            "tests/fixtures",
            "tests/helpers"
        ]

        for directory in directories:
            os.makedirs(os.path.join(base_dir, directory), exist_ok=True)

        # Create basic configuration files
        config_content = {
            "playwright.config.ts": """
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './tests',
    timeout: 30000,
    retries: 2,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        screenshot: 'only-on-failure',
    },
    reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],
};

export default config;
            """.strip(),
            
            "package.json": """
{
    "name": "playwright-tests",
    "version": "1.0.0",
    "scripts": {
        "test": "playwright test",
        "test:headed": "playwright test --headed",
        "report": "playwright show-report"
    },
    "devDependencies": {
        "@playwright/test": "^1.40.0"
    }
}
            """.strip()
        }

        for filename, content in config_content.items():
            with open(os.path.join(base_dir, filename), 'w') as f:
                f.write(content)
