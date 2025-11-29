import { Injectable } from '@nestjs/common';
import {
  ShortUrl,
  ShortUrlProps,
} from '../../domain/entities/short-url.entity';
import { ShortUrlRepository } from '../../domain/repositories/short-url.repository';
import { PG } from 'src/shared/infra/database/pg';
import { PaginationOptions } from 'src/shared/types/pagination-options.type';
import { ListingResponse } from 'src/shared/types/listing-response.type';

@Injectable()
export class PgShortUrlRepository implements ShortUrlRepository {
  private pg = PG.client;

  private mapRowToEntity(row: any): ShortUrl {
    return ShortUrl.fromJSON(
      {
        id: row.id,
        hash: row.hash,
        url: row.url,
        click_count: row.click_count,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      'SNAKE_CASE',
    );
  }

  async create(shortUrl: ShortUrl): Promise<void> {
    const query = `
      INSERT INTO short_urls (id, hash, url, click_count, created_at, updated_at, removed_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.pg.query(query, [
      shortUrl.id,
      shortUrl.hash,
      shortUrl.url,
      shortUrl.clickCount,
      shortUrl.createdAt,
      shortUrl.updatedAt,
      null,
    ]);
  }

  async findByHash(hash: string): Promise<ShortUrl | null> {
    const query =
      'SELECT * FROM short_urls WHERE hash = $1 AND removed_at IS NULL';

    const result = await this.pg.query(query, [hash]);

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async findById(id: string): Promise<ShortUrl | null> {
    const query =
      'SELECT * FROM short_urls WHERE id = $1 AND removed_at IS NULL';
    const result = await this.pg.query(query, [id]);

    if (result.rows.length === 0) return null;

    return this.mapRowToEntity(result.rows[0]);
  }

  async list(
    options?: PaginationOptions<keyof ShortUrlProps>,
  ): Promise<ListingResponse<ShortUrl>> {
    const currentPage = options?.page ?? 1;
    const limit = 100;
    const offset = (currentPage - 1) * limit;

    const sortBy = options?.orderBy ?? 'createdAt';
    const sortOrder = options?.order ?? 'DESC';

    const columnMap: Record<keyof ShortUrlProps, string> = {
      id: 'id',
      hash: 'hash',
      url: 'url',
      clickCount: 'click_count',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };

    const columnName = columnMap[sortBy];

    const dataQuery = `
      SELECT * FROM short_urls 
      WHERE removed_at IS NULL
      ORDER BY ${columnName} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const countQuery =
      'SELECT COUNT(*) as total FROM short_urls WHERE removed_at IS NULL';

    const [dataResult, countResult] = await Promise.all([
      this.pg.query(dataQuery, [limit, offset]),
      this.pg.query(countQuery),
    ]);

    const data = dataResult.rows.map((row) => this.mapRowToEntity(row));
    const total = parseInt(String(countResult.rows[0].total), 10);

    return {
      data,
      currentPage,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(shortUrl: ShortUrl): Promise<void> {
    const query = `
    UPDATE short_urls 
    SET 
      hash = $1,
      url = $2,
      click_count = $3,
      updated_at = $4
    WHERE id = $5 AND removed_at IS NULL
  `;

    await this.pg.query(query, [
      shortUrl.hash,
      shortUrl.url,
      shortUrl.clickCount,
      shortUrl.updatedAt,
      shortUrl.id,
    ]);
  }

  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as total FROM short_urls';
    const result = await this.pg.query(query);

    return parseInt(String(result.rows[0].total), 10);
  }

  async delete(id: string): Promise<void> {
    const query = `
      UPDATE short_urls 
      SET removed_at = NOW() 
      WHERE id = $1 AND removed_at IS NULL
    `;
    await this.pg.query(query, [id]);
  }
}
