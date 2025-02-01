import { PrismaClient } from '@prisma/client';
import { PageObjectData } from '../types/pageObject';
import { PageObjectGenerator } from '../generators/pageObjectGenerator';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export class PageObjectService {
    static async createPageObject(data: PageObjectData) {
        const pageObject = await prisma.pageObject.create({
            data: {
                name: data.name,
                url: data.url,
                selectors: data.selectors,
            },
        });

        const generatedCode = PageObjectGenerator.generateTypeScript(data);
        const fileName = `${this.formatFileName(data.name)}.ts`;
        const filePath = path.join(process.cwd(), 'tests', 'pages', fileName);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, generatedCode);

        return pageObject;
    }

    static async getPageObject(id: string) {
        return prisma.pageObject.findUnique({
            where: { id },
        });
    }

    static async updatePageObject(id: string, data: PageObjectData) {
        return prisma.pageObject.update({
            where: { id },
            data: {
                name: data.name,
                url: data.url,
                selectors: data.selectors,
            },
        });
    }

    static async deletePageObject(id: string) {
        return prisma.pageObject.delete({
            where: { id },
        });
    }

    private static formatFileName(name: string): string {
        return name
            .toLowerCase()
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Page';
    }
} 