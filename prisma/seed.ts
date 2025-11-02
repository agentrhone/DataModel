import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Minimal seed to validate migrations
  await prisma.adSpend.create({
    data: { date: new Date(), platform: "Facebook", spend: 0 },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

