import seedPlans from "./plans";
import clean from "./clean";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { plans } = await seedPlans();
}

clean()
  .catch((e) => console.error(e))
  .finally(async () => {
    console.info("cleaned");
    // reload
    main()
      .catch((e) => console.error(e))
      .finally(async () => {
        console.info("populated");
        await prisma.$disconnect();
      });
  });
