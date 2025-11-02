import { prisma } from "@/lib/db";

export async function kpiSummary({ since }: { since: Date }) {
  const ordersAgg = await prisma.order.aggregate({
    _sum: { grossTotal: true, netTotal: true },
    _count: { id: true },
    where: { createdAt: { gte: since } },
  });
  const gross = Number(ordersAgg._sum.grossTotal ?? 0);
  const net = Number(ordersAgg._sum.netTotal ?? 0);
  const count = ordersAgg._count.id ?? 0;
  const aov = count ? gross / count : 0;

  const newCustomers = await prisma.customer.count({ where: { firstOrderDate: { gte: since } } });
  const repeatCustomers = await prisma.customer.count({ where: { orderCount: { gt: 1 }, lastOrderDate: { gte: since } } });
  const repeatRate = (newCustomers + repeatCustomers) > 0 ? repeatCustomers / (newCustomers + repeatCustomers) : 0;

  return { gross, net, aov, repeatRate };
}

