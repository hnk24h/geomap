import PuzzleBoard from '../../../components/PuzzleBoard'
import { vietnamProvinces } from '../../../lib/geo'
export default function VietnamPage() { return <PuzzleBoard title="Vietnam" subtitle="Province puzzle · Easy" center={[15.7, 106.2]} zoom={6} pieces={vietnamProvinces} parentHref="/" /> }
