from typing import Dict, List, Optional
from jinja2 import Environment, PackageLoader, select_autoescape
import os
import re
from sqlalchemy.orm import Session
from app.services.test_suite import TestSuiteService
from app.services.test_case import TestCaseService
from app.services.page import PageService
from app.models.code_generator import GeneratedCode, CodeType
from app.models.page import Page
from app.models.test_case import TestCase
from app.schemas.code_generator import (
    CodeGeneratorCreate,
    CodeGeneratorUpdate,
    PageObjectTemplate,
    TestCaseTemplate,
    ConfigTemplate,
)

class PlaywrightCodeGenerator:
    def __init__(self, db: Session):
        self.env = Environment(
            loader=PackageLoader('app', 'templates'),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.db = db
        self.test_suite_service = TestSuiteService(db)
        self.test_case_service = TestCaseService(db)
        self.page_service = PageService(db)

    def generate_page_object(self, page_id: int, output_dir: Optional[str] = None) -> Dict[str, str]:
        """Generate Page Object class from page data"""
        # Get page data
        page = self.page_service.get(page_id)
        if not page:
            raise ValueError(f"Page with id {page_id} not found")

        template = self.env.get_template('page_object.py.jinja2')
        
        # Convert page name to class name
        class_name = self._to_class_name(page.name)
        
        # Generate code
        code_content = template.render(
            class_name=class_name,
            url_pattern=page.url_pattern,
            selectors=page.selectors
        )

        # Save to file if output_dir is provided
        file_path = None
        if output_dir:
            file_path = os.path.join(output_dir, f"{self._to_file_name(page.name)}_page.py")
            os.makedirs(output_dir, exist_ok=True)
            with open(file_path, "w") as f:
                f.write(code_content)

        return {
            "file_path": file_path or f"{self._to_file_name(page.name)}_page.py",
            "code_content": code_content
        }

    def generate_test_file(self, test_suite_id: int, output_dir: Optional[str] = None) -> Dict[str, str]:
        """Generate test file from test suite data"""
        # Get test suite data with test cases
        test_suite = self.test_suite_service.get_with_test_cases(test_suite_id)
        if not test_suite:
            raise ValueError(f"Test suite with id {test_suite_id} not found")

        template = self.env.get_template('test_file.py.jinja2')
        
        # Prepare test cases with their steps
        test_cases = []
        for test_case in test_suite.test_cases:
            test_case_data = {
                "name": test_case.name,
                "steps": [self._prepare_step(step) for step in test_case.steps],
                "before_each": test_case.before_each,
                "after_each": test_case.after_each
            }
            test_cases.append(test_case_data)

        # Generate code
        code_content = template.render(
            test_suite_name=test_suite.name,
            test_cases=test_cases,
            configuration=test_suite.configuration
        )

        # Save to file if output_dir is provided
        file_path = None
        if output_dir:
            file_path = os.path.join(output_dir, f"{self._to_file_name(test_suite.name)}.spec.ts")
            os.makedirs(output_dir, exist_ok=True)
            with open(file_path, "w") as f:
                f.write(code_content)

        return {
            "file_path": file_path or f"{self._to_file_name(test_suite.name)}.spec.ts",
            "code_content": code_content
        }

    def generate_project(self, test_suite_ids: List[int], output_dir: str, config: Dict = None) -> Dict[str, List[str]]:
        """Generate complete Playwright test project"""
        if not os.path.isabs(output_dir):
            raise ValueError("output_dir must be an absolute path")

        # Create project structure
        self.create_project_structure(output_dir)
        
        generated_files = []
        
        # Generate Page Objects for all unique pages
        pages_dir = os.path.join(output_dir, "tests", "pages")
        unique_pages = set()
        for test_suite_id in test_suite_ids:
            test_suite = self.test_suite_service.get_with_test_cases(test_suite_id)
            for test_case in test_suite.test_cases:
                for step in test_case.steps:
                    if "page_id" in step:
                        unique_pages.add(step["page_id"])
        
        for page_id in unique_pages:
            result = self.generate_page_object(page_id, pages_dir)
            generated_files.append(result["file_path"])

        # Generate test files
        tests_dir = os.path.join(output_dir, "tests")
        for test_suite_id in test_suite_ids:
            result = self.generate_test_file(test_suite_id, tests_dir)
            generated_files.append(result["file_path"])

        # Generate configuration files
        config_files = self._generate_config_files(output_dir, config or {})

        return {
            "project_dir": output_dir,
            "generated_files": generated_files,
            "config_files": config_files
        }

    def _prepare_step(self, step: Dict) -> Dict:
        """Prepare step data for template rendering"""
        step_copy = step.copy()
        step_copy["code"] = self.generate_step_code(step)
        return step_copy

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

    def _generate_config_files(self, base_dir: str, config: Dict) -> List[str]:
        """Generate configuration files for the project"""
        config_files = []

        # playwright.config.ts
        playwright_config = {
            "testDir": "./tests",
            "timeout": config.get("timeout", 30000),
            "retries": config.get("retries", 2),
            "use": {
                "headless": config.get("headless", True),
                "viewport": config.get("viewport", {"width": 1280, "height": 720}),
                "screenshot": config.get("screenshot", "only-on-failure"),
            },
            "reporter": config.get("reporter", [["html"], ["json", {"outputFile": "test-results.json"}]]),
        }

        config_path = os.path.join(base_dir, "playwright.config.ts")
        with open(config_path, "w") as f:
            f.write(f"""
import {{ PlaywrightTestConfig }} from '@playwright/test';

const config: PlaywrightTestConfig = {playwright_config};

export default config;
            """.strip())
        config_files.append(config_path)

        # package.json
        package_json = {
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

        package_path = os.path.join(base_dir, "package.json")
        with open(package_path, "w") as f:
            f.write(str(package_json))
        config_files.append(package_path)

        return config_files

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

def get_generated_code(db: Session, code_id: int):
    return db.query(GeneratedCode).filter(GeneratedCode.id == code_id).first()

def get_generated_code_list(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(GeneratedCode)
        .filter(GeneratedCode.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_generated_code(db: Session, code: CodeGeneratorCreate, content: str):
    db_code = GeneratedCode(**code.model_dump(), content=content)
    db.add(db_code)
    db.commit()
    db.refresh(db_code)
    return db_code

def update_generated_code(db: Session, code_id: int, code: CodeGeneratorUpdate):
    db_code = get_generated_code(db, code_id)
    if db_code:
        update_data = code.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_code, key, value)
        db.commit()
        db.refresh(db_code)
    return db_code

def delete_generated_code(db: Session, code_id: int):
    db_code = get_generated_code(db, code_id)
    if db_code:
        db.delete(db_code)
        db.commit()
    return db_code

def generate_page_object(db: Session, page_id: int, project_id: int) -> Optional[str]:
    """Page Objectクラスのコードを生成します"""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        return None

    template = PageObjectTemplate(
        class_name=f"{page.name.title().replace(' ', '')}Page",
        url_pattern=page.url_pattern,
        selectors=page.selectors,
        wait_conditions=page.wait_conditions,
        iframe_selector=page.iframe_selector
    )

    # テンプレートからコードを生成
    code = f"""import { Page } from '@playwright/test';

export class {template.class_name} {{
    private page: Page;

    constructor(page: Page) {{
        this.page = page;
    }}

    // URL pattern for this page
    static readonly URL_PATTERN = '{template.url_pattern}';

    // Selectors
"""

    # セレクタの定義を追加
    for name, selector in template.selectors.items():
        code += f"    private readonly {name}Selector = '{selector['xpath']}';\n"

    # メソッドを生成
    for name, selector in template.selectors.items():
        method_name = name.lower()
        code += f"""
    async get{name.title()}() {{
        return this.page.locator(this.{name}Selector);
    }}
"""

    # iframeがある場合の処理を追加
    if template.iframe_selector:
        code += f"""
    private async switchToFrame() {{
        const frame = this.page.frameLocator('{template.iframe_selector}');
        return frame;
    }}
"""

    code += "}\n"
    return code

def generate_test_case(db: Session, test_case_id: int, project_id: int) -> Optional[str]:
    """テストケースのコードを生成します"""
    test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not test_case:
        return None

    template = TestCaseTemplate(
        class_name=f"{test_case.name.title().replace(' ', '')}Test",
        description=test_case.description,
        test_data=test_case.test_data[0].data if test_case.test_data else None,
        before_each=test_case.before_each,
        after_each=test_case.after_each,
        steps=test_case.steps,
        expected_results=test_case.expected_results
    )

    # テンプレートからコードを生成
    code = f"""import {{ test, expect }} from '@playwright/test';
import {{ {template.class_name}Page }} from '../pages/{template.class_name.lower()}.page';

test.describe('{template.description or template.class_name}', () => {{
"""

    # beforeEachの生成
    if template.before_each:
        code += """
    test.beforeEach(async ({ page }) => {
"""
        for step in template.before_each:
            code += f"        // {step['description']}\n" if 'description' in step else ""
            code += f"        await page.{step['action']}('{step['xpath']}'{', ' + str(step['args']) if 'args' in step else ''});\n"
        code += "    });\n"

    # テストケースの生成
    code += f"""
    test('should complete the test scenario', async ({{ page }}) => {{
"""

    # テストデータがある場合
    if template.test_data:
        code += f"        const testData = {template.test_data};\n"

    # テストステップの生成
    for step in template.steps:
        code += f"        // {step['description']}\n" if 'description' in step else ""
        code += f"        await page.{step['action']}('{step['xpath']}'{', ' + str(step['args']) if 'args' in step else ''});\n"

    # 期待結果の検証
    if template.expected_results:
        for result in template.expected_results:
            code += f"        await expect(page.locator('{result['selector']}')).{result['comparison_type']}({result['expected_value']});\n"

    code += "    });\n});\n"
    return code

def generate_config(db: Session, project_id: int) -> Optional[str]:
    """Playwrightの設定ファイルを生成します"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None

    template = ConfigTemplate(
        project_name=project.name,
        browser_type="chromium",  # デフォルト値
        viewport={"width": 1280, "height": 720},
        timeout=30000,
        screenshot_dir="./screenshots",
        video_dir="./videos",
        retry_count=2
    )

    # テンプレートからコードを生成
    code = f"""import {{ PlaywrightTestConfig }} from '@playwright/test';

const config: PlaywrightTestConfig = {{
    testDir: './tests',
    timeout: {template.timeout},
    retries: {template.retry_count},
    use: {{
        baseURL: '{template.base_url or ""}',
        viewport: {{ width: {template.viewport['width']}, height: {template.viewport['height']} }},
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    }},
    projects: [
        {{
            name: '{template.browser_type}',
            use: {{
                browserName: '{template.browser_type}',
            }},
        }},
    ],
    reporter: [
        ['html', {{ outputFolder: './playwright-report' }}],
        ['json', {{ outputFile: './playwright-report/test-results.json' }}]
    ],
    outputDir: './test-results',
    preserveOutput: 'failures-only',
    globalSetup: require.resolve('./global-setup'),
    globalTeardown: require.resolve('./global-teardown'),
}};

export default config;
"""
    return code
