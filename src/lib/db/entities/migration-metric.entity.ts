import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from './base.entity';

@Entity('migration_metrics')
export class MigrationMetric extends CustomBaseEntity {
    @Column()
    migration_name: string;

    @Column()
    execution_time: number;

    @Column()
    direction: 'up' | 'down';

    @Column()
    executed_at: Date;

    @Column({ nullable: true })
    error_message?: string;
} 