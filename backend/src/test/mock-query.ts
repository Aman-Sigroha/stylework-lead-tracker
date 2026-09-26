import type { Mock } from 'vitest';

export const LEAD_ID = '550e8400-e29b-41d4-a716-446655440000';
export const MISSING_LEAD_ID = '00000000-0000-0000-0000-000000000000';

type MockLeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export function createMockLeadRow(
  overrides: Partial<MockLeadRow> = {},
): MockLeadRow {
  return {
    id: LEAD_ID,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 555 0100',
    status: 'new',
    created_at: new Date('2026-03-25T10:00:00.000Z'),
    updated_at: new Date('2026-03-25T10:00:00.000Z'),
    ...overrides,
  };
}

type QueryFn = (
  text: string,
  params?: unknown[],
) => Promise<{ rows: MockLeadRow[]; rowCount: number }>;

export function installDefaultQueryMock(queryMock: Mock<QueryFn>): void {
  queryMock.mockImplementation(async (text: string, params?: unknown[]) => {
    if (text.includes('INSERT INTO leads')) {
      return {
        rows: [
          createMockLeadRow({
            name: String(params?.[0]),
            email: String(params?.[1]),
            phone: (params?.[2] as string | null) ?? null,
            status: String(params?.[3]),
          }),
        ],
        rowCount: 1,
      };
    }

    if (text.includes('UPDATE leads')) {
      const id = String(params?.[0]);
      const status = String(params?.[1]);

      if (id === MISSING_LEAD_ID) {
        return { rows: [], rowCount: 0 };
      }

      return {
        rows: [
          createMockLeadRow({
            id,
            status,
            updated_at: new Date('2026-03-25T11:00:00.000Z'),
          }),
        ],
        rowCount: 1,
      };
    }

    if (text.includes('FROM leads')) {
      if (text.includes('WHERE')) {
        const pattern = String(params?.[0] ?? '');
        if (pattern === '%nomatch%') {
          return { rows: [], rowCount: 0 };
        }

        return { rows: [createMockLeadRow()], rowCount: 1 };
      }

      return {
        rows: [
          createMockLeadRow(),
          createMockLeadRow({
            id: '660e8400-e29b-41d4-a716-446655440001',
            name: 'John Smith',
            email: 'john@example.com',
          }),
        ],
        rowCount: 2,
      };
    }

    return { rows: [], rowCount: 0 };
  });
}
