import PuzzleBoard from '../../../components/PuzzleBoard'
import { prisma } from '../../../lib/prisma'
import { vietnamProvinces } from '../../../lib/geo'

export default async function VietnamPage() {
	const country = await prisma.country.findUnique({
		where: { slug: 'vietnam' },
		select: {
			id: true,
			unlockBatchSize: true,
			_count: { select: { provinces: true } },
		},
	}).catch(() => null)

	const batchSize = country?.unlockBatchSize && country.unlockBatchSize > 0 ? country.unlockBatchSize : 10

	const initialProvinces = country
		? await prisma.province.findMany({
				where: { countryId: country.id },
				orderBy: { name: 'asc' },
				take: batchSize,
			})
		: []

	const pieces = initialProvinces.length
		? initialProvinces.map((province) => ({
				slug: province.slug,
				name: province.name,
				subtitle: province.subtitle,
				fact: province.fact,
				lat: province.lat,
				lng: province.lng,
				color: province.color,
				coverImageUrl: province.coverImageUrl,
				attractions: province.attractions,
				notablePeople: province.notablePeople,
			}))
		: vietnamProvinces

	const totalPieces = country?._count.provinces || pieces.length

	return (
		<PuzzleBoard
			title="Vietnam"
			subtitle="Province puzzle · Easy"
			center={[15.7, 106.2]}
			zoom={6}
			pieces={pieces}
			batchSize={batchSize}
			totalPieces={totalPieces}
			loadMorePath={country ? '/api/game/countries/vietnam/provinces' : undefined}
			parentHref="/"
		/>
	)
}
