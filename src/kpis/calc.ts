export type OrderLike = { grossTotal: number };

export function aov(orders: OrderLike[]): number {
  if (!orders.length) return 0;
  const sum = orders.reduce((acc, o) => acc + (o.grossTotal || 0), 0);
  return sum / orders.length;
}

export function repeatRate(newCustomers: number, repeatCustomers: number): number {
  const denom = newCustomers + repeatCustomers;
  return denom > 0 ? repeatCustomers / denom : 0;
}

