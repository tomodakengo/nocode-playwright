export type Selector = {
    name: string;
    type: 'xpath' | 'css';
    value: string;
    description?: string;
}

export type PageObjectData = {
    name: string;
    url: string;
    selectors: Selector[];
}

export type TestStep = {
    action: 'click' | 'type' | 'navigate' | 'assert' | 'wait';
    selector?: string;
    value?: string;
    description?: string;
}

export type TestCaseData = {
    name: string;
    description?: string;
    steps: TestStep[];
} 