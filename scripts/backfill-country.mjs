import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const vietnamCountry = {
  slug: 'vietnam',
  name: 'Vietnam',
  subtitle: 'Southeast Asia',
  fact: 'Vietnam has 63 provinces and centrally governed cities.',
  lat: 15.903,
  lng: 105.806,
  color: '#5fbcaa',
}

async function main() {
  const country = await prisma.country.upsert({
    where: { slug: vietnamCountry.slug },
    update: vietnamCountry,
    create: vietnamCountry,
  })

  const result = await prisma.province.updateMany({
    where: { countryId: null },
    data: { countryId: country.id },
  })

  console.log('Backfilled provinces:', result.count)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
