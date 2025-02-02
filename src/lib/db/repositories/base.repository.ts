import {
    Repository,
    FindOptionsWhere,
    FindOptionsOrder,
    DeepPartial,
    EntityTarget,
    FindManyOptions,
    FindOneOptions
} from 'typeorm';
import { DatabaseCache, withCache } from '../cache';
import { CustomBaseEntity } from '../entities/base.entity';
import { AppDataSource } from '../data-source';

export abstract class BaseRepository<T extends CustomBaseEntity> {
    protected repository: Repository<T>;
    protected cache: DatabaseCache;

    constructor(entity: EntityTarget<T>) {
        this.repository = AppDataSource.getRepository(entity);
        this.cache = DatabaseCache.getInstance();
    }

    protected getCacheKey(method: string, params: any[]): string {
        return this.cache.getCacheKey(this.repository.metadata.tableName, method, params);
    }

    async findById(id: number, options?: FindOneOptions<T>): Promise<T | null> {
        const cacheKey = this.getCacheKey('findById', [id, options]);
        return withCache(this.cache, cacheKey, () => {
            return this.repository.findOne({
                ...options,
                where: { id } as FindOptionsWhere<T>
            });
        });
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        const cacheKey = this.getCacheKey('findAll', [options]);
        return withCache(this.cache, cacheKey, () => {
            return this.repository.find(options);
        });
    }

    async findBy(where: FindOptionsWhere<T>, options?: FindManyOptions<T>): Promise<T[]> {
        const cacheKey = this.getCacheKey('findBy', [where, options]);
        return withCache(this.cache, cacheKey, () => {
            return this.repository.find({
                ...options,
                where
            });
        });
    }

    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        await this.repository.save(entity);
        this.invalidateTableCache();
        return entity;
    }

    async update(id: number, data: DeepPartial<T>): Promise<T | null> {
        await this.repository.update(id, data);
        this.invalidateTableCache();
        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.softDelete(id);
        this.invalidateTableCache();
        return result.affected ? result.affected > 0 : false;
    }

    async hardDelete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        this.invalidateTableCache();
        return result.affected ? result.affected > 0 : false;
    }

    async restore(id: number): Promise<boolean> {
        const result = await this.repository.restore(id);
        this.invalidateTableCache();
        return result.affected ? result.affected > 0 : false;
    }

    async count(where?: FindOptionsWhere<T>): Promise<number> {
        const cacheKey = this.getCacheKey('count', [where]);
        return withCache(this.cache, cacheKey, () => {
            return this.repository.count({ where });
        });
    }

    async exists(where: FindOptionsWhere<T>): Promise<boolean> {
        const count = await this.count(where);
        return count > 0;
    }

    protected invalidateTableCache(): void {
        const keys = Array.from(this.cache['cache'].keys());
        const tableName = this.repository.metadata.tableName;
        keys.forEach(key => {
            if (key.startsWith(tableName)) {
                this.cache.delete(key);
            }
        });
    }

    async paginate(
        page: number = 1,
        limit: number = 10,
        options?: FindManyOptions<T>
    ): Promise<{ items: T[]; total: number; pages: number }> {
        const [items, total] = await this.repository.findAndCount({
            ...options,
            skip: (page - 1) * limit,
            take: limit
        });

        return {
            items,
            total,
            pages: Math.ceil(total / limit)
        };
    }

    async transaction<R>(operation: (repository: Repository<T>) => Promise<R>): Promise<R> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const result = await operation(queryRunner.manager.getRepository(this.repository.target));
            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
