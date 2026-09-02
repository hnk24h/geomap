import { notFound } from 'next/navigation'
import PuzzleBoard from '../../../../../components/PuzzleBoard'
import { prisma } from '../../../../../lib/prisma'
import { buildGenericDistrictBoundaries, districtBoundarySamples, districtSamples, genericDistricts, vietnamProvinces } from '../../../../../lib/geo'

export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const dbProvince = await prisma.province.findFirst({
		where: { slug, country: { slug: 'vietnam' } },
		include: { districts: { orderBy: { name: 'asc' } } },
	}).catch(() => null)

	const province = dbProvince || vietnamProvinces.find(item => item.slug === slug)
	if (!province) notFound()

	const pieces = dbProvince?.districts.length
		? dbProvince.districts.map((item) => ({
			slug: item.slug,
			name: item.name,
			subtitle: item.subtitle,
			fact: item.fact,
			lat: item.lat,
			lng: item.lng,
			color: item.color,
		}))
		: (districtSamples[slug] || genericDistricts).map((item) =>
				districtSamples[slug] ? item : { ...item, lat: province.lat + item.lat, lng: province.lng + item.lng },
			)

	const subdivisions = districtBoundarySamples[slug] || buildGenericDistrictBoundaries(province.lat, province.lng)

	return (
		<PuzzleBoard
			title={province.name}
			subtitle="District puzzle · Level 1"
			center={[province.lat, province.lng]}
			zoom={11}
			pieces={pieces}
			parentHref="/country/vietnam"
			provinceMode
			focusSlug={province.slug}
			subdivisions={subdivisions}
		/>
	)
}
