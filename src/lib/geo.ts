export type GeoPlace = { slug: string; name: string; subtitle: string; fact: string; lat: number; lng: number; color: string }
export type GeoSubdivision = { slug: string; coordinates: [number, number][] }

export const vietnamProvinces: GeoPlace[] = [
  { slug: 'ha-giang', name: 'Hà Giang', subtitle: 'Northeast', fact: 'Vietnam’s northernmost province, famed for its limestone mountains.', lat: 22.82, lng: 104.98, color: '#F2B950' },
  { slug: 'lao-cai', name: 'Lào Cai', subtitle: 'Northwest', fact: 'Home to Fansipan, the highest peak in Indochina.', lat: 22.48, lng: 103.97, color: '#83C7B8' },
  { slug: 'quang-tri', name: 'Quảng Trị', subtitle: 'Central Vietnam', fact: 'A central province bordering Laos to the west.', lat: 16.75, lng: 107.19, color: '#ED8068' },
  { slug: 'da-nang', name: 'Đà Nẵng', subtitle: 'Central coast', fact: 'A coastal city between the mountains and the East Sea.', lat: 16.06, lng: 108.22, color: '#AB8ED7' },
  { slug: 'lam-dong', name: 'Lâm Đồng', subtitle: 'Central Highlands', fact: 'The cool highlands around Đà Lạt sit here.', lat: 11.94, lng: 108.44, color: '#F3C25F' },
  { slug: 'can-tho', name: 'Cần Thơ', subtitle: 'Mekong Delta', fact: 'Known for floating markets and river life.', lat: 10.04, lng: 105.78, color: '#72B8D5' },
]

export const districtSamples: Record<string, GeoPlace[]> = {
  'quang-tri': [
    { slug: 'dong-ha', name: 'Đông Hà', subtitle: 'Provincial city', fact: 'The provincial capital of Quảng Trị.', lat: 16.815, lng: 107.101, color: '#ED8068' },
    { slug: 'cam-lo', name: 'Cam Lộ', subtitle: 'District', fact: 'A district on the historic North–South route.', lat: 16.79, lng: 106.97, color: '#F3C25F' },
    { slug: 'trieu-phong', name: 'Triệu Phong', subtitle: 'District', fact: 'A lowland district beside the Thạch Hãn River.', lat: 16.75, lng: 107.18, color: '#83C7B8' },
    { slug: 'hai-lang', name: 'Hải Lăng', subtitle: 'District', fact: 'A southern coastal district of Quảng Trị.', lat: 16.68, lng: 107.25, color: '#AB8ED7' },
  ],
}

export const genericDistricts: GeoPlace[] = [
  { slug: 'north', name: 'Northern district', subtitle: 'District level', fact: 'One of the local areas to discover.', lat: 0.06, lng: 0, color: '#F2B950' },
  { slug: 'central', name: 'Central district', subtitle: 'District level', fact: 'At the heart of this province.', lat: 0, lng: 0.05, color: '#83C7B8' },
  { slug: 'south', name: 'Southern district', subtitle: 'District level', fact: 'A local district waiting to be placed.', lat: -0.06, lng: 0, color: '#ED8068' },
]

export const districtBoundarySamples: Record<string, GeoSubdivision[]> = {
  'quang-tri': [
    {
      slug: 'dong-ha',
      coordinates: [
        [16.86, 107.05],
        [16.86, 107.16],
        [16.79, 107.17],
        [16.77, 107.08],
      ],
    },
    {
      slug: 'cam-lo',
      coordinates: [
        [16.86, 106.93],
        [16.86, 107.06],
        [16.77, 107.08],
        [16.73, 106.96],
      ],
    },
    {
      slug: 'trieu-phong',
      coordinates: [
        [16.79, 107.11],
        [16.79, 107.25],
        [16.71, 107.27],
        [16.70, 107.14],
      ],
    },
    {
      slug: 'hai-lang',
      coordinates: [
        [16.70, 107.08],
        [16.71, 107.27],
        [16.63, 107.30],
        [16.62, 107.12],
      ],
    },
  ],
}

export const buildGenericDistrictBoundaries = (provinceLat: number, provinceLng: number): GeoSubdivision[] => [
  {
    slug: 'north',
    coordinates: [
      [provinceLat + 0.14, provinceLng - 0.18],
      [provinceLat + 0.14, provinceLng + 0.18],
      [provinceLat + 0.03, provinceLng + 0.2],
      [provinceLat + 0.02, provinceLng - 0.2],
    ],
  },
  {
    slug: 'central',
    coordinates: [
      [provinceLat + 0.03, provinceLng - 0.2],
      [provinceLat + 0.03, provinceLng + 0.2],
      [provinceLat - 0.06, provinceLng + 0.2],
      [provinceLat - 0.06, provinceLng - 0.2],
    ],
  },
  {
    slug: 'south',
    coordinates: [
      [provinceLat - 0.06, provinceLng - 0.2],
      [provinceLat - 0.06, provinceLng + 0.2],
      [provinceLat - 0.16, provinceLng + 0.18],
      [provinceLat - 0.16, provinceLng - 0.18],
    ],
  },
]
