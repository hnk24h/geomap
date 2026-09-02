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

const provinces = [
  { slug: 'ha-giang', name: 'Hà Giang', subtitle: 'Northeast', fact: 'Vietnam’s northernmost province, famed for its limestone mountains.', lat: 22.82, lng: 104.98, color: '#F2B950' },
  { slug: 'lao-cai', name: 'Lào Cai', subtitle: 'Northwest', fact: 'Home to Fansipan, the highest peak in Indochina.', lat: 22.48, lng: 103.97, color: '#83C7B8' },
  { slug: 'quang-tri', name: 'Quảng Trị', subtitle: 'Central Vietnam', fact: 'A central province bordering Laos to the west.', lat: 16.75, lng: 107.19, color: '#ED8068' },
  { slug: 'da-nang', name: 'Đà Nẵng', subtitle: 'Central coast', fact: 'A coastal city between the mountains and the East Sea.', lat: 16.06, lng: 108.22, color: '#AB8ED7' },
  { slug: 'lam-dong', name: 'Lâm Đồng', subtitle: 'Central Highlands', fact: 'The cool highlands around Đà Lạt sit here.', lat: 11.94, lng: 108.44, color: '#F3C25F' },
  { slug: 'can-tho', name: 'Cần Thơ', subtitle: 'Mekong Delta', fact: 'Known for floating markets and river life.', lat: 10.04, lng: 105.78, color: '#72B8D5' },
]

async function main() {
  const country = await prisma.country.upsert({
    where: { slug: vietnamCountry.slug },
    update: vietnamCountry,
    create: vietnamCountry,
  })

  for (const province of provinces) {
    await prisma.province.upsert({
      where: { countryId_slug: { countryId: country.id, slug: province.slug } },
      update: province,
      create: { ...province, countryId: country.id },
    })
  }
  console.log('Seeded country + provinces:', country.slug, provinces.length)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
