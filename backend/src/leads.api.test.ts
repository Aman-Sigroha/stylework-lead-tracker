import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('./config/database.js', () => ({
  query: queryMock,
  pool: {},
  checkDatabaseConnection: vi.fn(),
}));

import {
  LEAD_ID,
  MISSING_LEAD_ID,
  installDefaultQueryMock,
} from './test/mock-query.js';

import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

beforeEach(() => {
  installDefaultQueryMock(queryMock);
});

describe('POST /api/leads', () => {
  it('returns 201 for a valid lead', async () => {
    const response = await request(app)
      .post('/api/leads')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1 555 0100',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('jane@example.com');
  });

  it('defaults status to new', async () => {
    const response = await request(app)
      .post('/api/leads')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('new');
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO leads'),
      ['Jane Doe', 'jane@example.com', null, 'new'],
    );
  });

  it('returns 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/leads')
      .send({ name: 'Jane Doe', email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 400 for missing or empty name', async () => {
    const missingName = await request(app)
      .post('/api/leads')
      .send({ email: 'jane@example.com' });

    expect(missingName.status).toBe(400);
    expect(missingName.body.success).toBe(false);

    const emptyName = await request(app)
      .post('/api/leads')
      .send({ name: '   ', email: 'jane@example.com' });

    expect(emptyName.status).toBe(400);
    expect(emptyName.body.success).toBe(false);
  });

  it('returns 400 for invalid status', async () => {
    const response = await request(app)
      .post('/api/leads')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'archived',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/leads')
      .set('Content-Type', 'application/json')
      .send('{ invalid json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'Invalid JSON body' },
    });
  });
});

describe('GET /api/leads', () => {
  it('returns 200', async () => {
    const response = await request(app).get('/api/leads');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('returns an array with default pagination metadata', async () => {
    const response = await request(app).get('/api/leads');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });

  it('supports combined search across name, email, and phone', async () => {
    const response = await request(app).get('/api/leads?search=jane');

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /name ILIKE \$1[\s\S]*OR email ILIKE \$1[\s\S]*OR COALESCE\(phone/,
      ),
      ['%jane%', 20, 0],
    );
  });

  it('supports searchBy=name', async () => {
    const response = await request(app).get(
      '/api/leads?search=jane&searchBy=name',
    );

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE name ILIKE $1'),
      ['%jane%', 20, 0],
    );
  });

  it('supports searchBy=email', async () => {
    const response = await request(app).get(
      '/api/leads?search=jane@example.com&searchBy=email',
    );

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email ILIKE $1'),
      ['%jane@example.com%', 20, 0],
    );
  });

  it('supports searchBy=phone', async () => {
    const response = await request(app).get(
      '/api/leads?search=9876&searchBy=phone',
    );

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("COALESCE(phone, '') ILIKE $1"),
      ['%9876%', 20, 0],
    );
  });

  it('returns 400 for invalid searchBy', async () => {
    const response = await request(app).get(
      '/api/leads?search=jane&searchBy=company',
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns an empty array when search has no matches', async () => {
    const response = await request(app).get('/api/leads?search=nomatch');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('orders by created_at DESC when no sort parameters are provided', async () => {
    await request(app).get('/api/leads');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY created_at DESC/),
      [20, 0],
    );
  });

  it('sorts by name ascending', async () => {
    await request(app).get('/api/leads?sortBy=name&sortOrder=asc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY name ASC, created_at DESC/),
      [20, 0],
    );
  });

  it('sorts by name descending', async () => {
    await request(app).get('/api/leads?sortBy=name&sortOrder=desc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY name DESC, created_at DESC/),
      [20, 0],
    );
  });

  it('sorts by email ascending', async () => {
    await request(app).get('/api/leads?sortBy=email&sortOrder=asc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY email ASC, created_at DESC/),
      [20, 0],
    );
  });

  it('sorts by email descending', async () => {
    await request(app).get('/api/leads?sortBy=email&sortOrder=desc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY email DESC, created_at DESC/),
      [20, 0],
    );
  });

  it('sorts by status ascending using workflow order', async () => {
    await request(app).get('/api/leads?sortBy=status&sortOrder=asc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /ORDER BY CASE status[\s\S]*WHEN 'new' THEN 1[\s\S]*END ASC, created_at DESC/,
      ),
      [20, 0],
    );
  });

  it('sorts by status descending using reversed workflow order', async () => {
    await request(app).get('/api/leads?sortBy=status&sortOrder=desc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /ORDER BY CASE status[\s\S]*END DESC, created_at DESC/,
      ),
      [20, 0],
    );
  });

  it('returns 400 for invalid sortBy', async () => {
    const response = await request(app).get('/api/leads?sortBy=created_at');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 400 for invalid sortOrder', async () => {
    const response = await request(app).get(
      '/api/leads?sortBy=name&sortOrder=up',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('combines search with sorting', async () => {
    await request(app).get(
      '/api/leads?search=jane&searchBy=name&sortBy=email&sortOrder=asc',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /WHERE name ILIKE \$1[\s\S]*ORDER BY email ASC, created_at DESC/,
      ),
      ['%jane%', 20, 0],
    );
  });
});

describe('PATCH /api/leads/:id/status', () => {
  it('returns 200 for valid UUID and status', async () => {
    const response = await request(app)
      .patch(`/api/leads/${LEAD_ID}/status`)
      .send({ status: 'contacted' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('contacted');
  });

  it('returns 400 for invalid UUID', async () => {
    const response = await request(app)
      .patch('/api/leads/not-a-uuid/status')
      .send({ status: 'contacted' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 400 for invalid status', async () => {
    const response = await request(app)
      .patch(`/api/leads/${LEAD_ID}/status`)
      .send({ status: 'archived' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 404 when the lead does not exist', async () => {
    const response = await request(app)
      .patch(`/api/leads/${MISSING_LEAD_ID}/status`)
      .send({ status: 'contacted' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'Lead not found' },
    });
  });

  it('returns the updated lead shape on success', async () => {
    const response = await request(app)
      .patch(`/api/leads/${LEAD_ID}/status`)
      .send({ status: 'qualified' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: LEAD_ID,
      name: expect.any(String),
      email: expect.any(String),
      phone: expect.any(String),
      status: 'qualified',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});

describe('PUT /api/leads/:id', () => {
  it('returns 200 and updates lead fields', async () => {
    const response = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+1 555 9999',
        status: 'contacted',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: LEAD_ID,
      name: 'Updated Name',
      email: 'updated@example.com',
      phone: '+1 555 9999',
      status: 'contacted',
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/SET name = \$2[\s\S]*status = \$5/),
      [
        LEAD_ID,
        'Updated Name',
        'updated@example.com',
        '+1 555 9999',
        'contacted',
      ],
    );
  });

  it('normalizes empty phone to null in the SQL params', async () => {
    const response = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '',
      });

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/SET name = \$2[\s\S]*phone = \$4/),
      [LEAD_ID, 'Updated Name', 'updated@example.com', null],
    );
  });

  it('returns 400 for invalid UUID', async () => {
    const response = await request(app)
      .put('/api/leads/not-a-uuid')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 400 for invalid email', async () => {
    const response = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({
        name: 'Jane Doe',
        email: 'not-an-email',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 400 for missing or empty name', async () => {
    const missingName = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({ email: 'jane@example.com' });

    expect(missingName.status).toBe(400);

    const emptyName = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({ name: '   ', email: 'jane@example.com' });

    expect(emptyName.status).toBe(400);
  });

  it('returns 400 for invalid status', async () => {
    const response = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'archived',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 404 when the lead does not exist', async () => {
    const response = await request(app)
      .put(`/api/leads/${MISSING_LEAD_ID}`)
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'Lead not found' },
    });
  });

  it('returns 500 when the database fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));

    const response = await request(app)
      .put(`/api/leads/${LEAD_ID}`)
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'Failed to update lead' },
    });
  });
});

describe('DELETE /api/leads/:id', () => {
  it('returns 200 when the lead is deleted', async () => {
    const response = await request(app).delete(`/api/leads/${LEAD_ID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Lead deleted successfully',
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM leads'),
      [LEAD_ID],
    );
  });

  it('returns 400 for invalid UUID', async () => {
    const response = await request(app).delete('/api/leads/not-a-uuid');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 404 when the lead does not exist', async () => {
    const response = await request(app).delete(
      `/api/leads/${MISSING_LEAD_ID}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'Lead not found' },
    });
  });

  it('returns 500 when the database fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('connection refused'));

    const response = await request(app).delete(`/api/leads/${LEAD_ID}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: { message: 'Failed to delete lead' },
    });
  });
});
