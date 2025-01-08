import { PrismaClient } from "@prisma/client";
// import { faker } from "@faker-js/faker";
// import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export default async function seedTypes() {
  await prisma.plan.createMany({
    data: [
      {
        name: "Stunts",
        price: 699,
        description:
          "This subscription covers access to the Stunts desktop application.",
        stripeDevPriceId: "",
        stripePriceId: "",
      },
    ],
  });

  const plans = await prisma.plan.findMany();

  // console.info("plans", plans);

  return {
    plans,
  };
}
