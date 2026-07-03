let sequence = 0;

export function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  sequence = (sequence % 9999) + 1;
  const seq = String(sequence).padStart(4, '0');
  return `PH-${yyyy}${mm}${dd}-${seq}`;
}
