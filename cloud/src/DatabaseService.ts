import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(private dataSource: DataSource) {}

  async onApplicationShutdown(signal?: string) {
    console.log(`App is shutting down due to signal: ${signal}`);
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      console.log('Database connection pool closed.');
    }
  }
}
