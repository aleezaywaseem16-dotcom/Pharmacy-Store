import { generateOrderNumber } from '@/utils/orderNumber';

describe('generateOrderNumber', () => {
  it('matches the format PH-YYYYMMDD-XXXX', () => {
    const num = generateOrderNumber();
    expect(num).toMatch(/^PH-\d{8}-\d{4}$/);
  });

  it('contains the current date', () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const num = generateOrderNumber();
    expect(num).toContain(`PH-${yyyy}${mm}${dd}-`);
  });

  it('increments sequence on each call', () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    const seqA = parseInt(a.split('-')[2], 10);
    const seqB = parseInt(b.split('-')[2], 10);
    expect(seqB).toBe(seqA + 1);
  });

  it('pads sequence to 4 digits', () => {
    const num = generateOrderNumber();
    const seq = num.split('-')[2];
    expect(seq).toHaveLength(4);
  });

  it('generates unique numbers across multiple calls', () => {
    const numbers = Array.from({ length: 10 }, () => generateOrderNumber());
    const unique = new Set(numbers);
    expect(unique.size).toBe(10);
  });
});
