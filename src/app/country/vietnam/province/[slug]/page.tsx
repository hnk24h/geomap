import { notFound } from 'next/navigation'
import PuzzleBoard from '../../../../../components/PuzzleBoard'
import { districtSamples, genericDistricts, vietnamProvinces } from '../../../../../lib/geo'
export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const province = vietnamProvinces.find(item => item.slug === slug); if (!province) notFound(); const pieces = (districtSamples[slug] || genericDistricts).map((item) => districtSamples[slug] ? item : { ...item, lat: province.lat + item.lat, lng: province.lng + item.lng }); return <PuzzleBoard title={province.name} subtitle="District puzzle · Level 1" center={[province.lat, province.lng]} zoom={11} pieces={pieces} parentHref="/country/vietnam" provinceMode /> }
