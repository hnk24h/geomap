'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import styles from './admin.module.css'

type Country = {
  id: number
  slug: string
  name: string
  subtitle: string
  fact: string
  lat: number
  lng: number
  color: string
  unlockBatchSize: number
  _count?: { provinces: number }
}

type Province = {
  id: number
  countryId: number
  slug: string
  name: string
  subtitle: string
  fact: string
  lat: number
  lng: number
  color: string
  _count?: { districts: number }
}

type LocalUnitType = 'DISTRICT' | 'WARD' | 'CITY'

type LocalUnit = {
  id: number
  provinceId: number
  slug: string
  name: string
  subtitle: string
  fact: string
  lat: number
  lng: number
  color: string
  levelType: LocalUnitType
}

const emptyCountry = {
  slug: '',
  name: '',
  subtitle: 'Country level',
  fact: '',
  lat: '',
  lng: '',
  color: '#5fbcaa',
  unlockBatchSize: '10',
}

const emptyProvince = {
  slug: '',
  name: '',
  subtitle: 'Province level',
  fact: '',
  lat: '',
  lng: '',
  color: '#72B8D5',
}

const emptyLocalUnit = {
  slug: '',
  name: '',
  subtitle: 'Local unit level',
  fact: '',
  lat: '',
  lng: '',
  color: '#83C7B8',
  levelType: 'DISTRICT' as LocalUnitType,
}

export default function AdminCms() {
  const [countries, setCountries] = useState<Country[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [localUnits, setLocalUnits] = useState<LocalUnit[]>([])

  const [countryForm, setCountryForm] = useState(emptyCountry)
  const [provinceForm, setProvinceForm] = useState(emptyProvince)
  const [localUnitForm, setLocalUnitForm] = useState(emptyLocalUnit)

  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const selectedCountry = useMemo(
    () => countries.find((country) => country.id === selectedCountryId) || null,
    [countries, selectedCountryId],
  )

  const selectedProvince = useMemo(
    () => provinces.find((province) => province.id === selectedProvinceId) || null,
    [provinces, selectedProvinceId],
  )

  const loadCountries = async () => {
    const response = await fetch('/api/admin/countries', { cache: 'no-store' })
    const data = (await response.json()) as Country[]
    setCountries(data)

    if (!selectedCountryId && data[0]) {
      setSelectedCountryId(data[0].id)
      return
    }

    if (selectedCountryId && !data.some((country) => country.id === selectedCountryId)) {
      setSelectedCountryId(data[0]?.id || null)
    }
  }

  const loadProvinces = async (countryId: number | null) => {
    if (!countryId) {
      setProvinces([])
      setSelectedProvinceId(null)
      return
    }

    const response = await fetch(`/api/admin/provinces?countryId=${countryId}`, { cache: 'no-store' })
    const data = (await response.json()) as Province[]
    setProvinces(data)

    if (!selectedProvinceId && data[0]) {
      setSelectedProvinceId(data[0].id)
      return
    }

    if (selectedProvinceId && !data.some((province) => province.id === selectedProvinceId)) {
      setSelectedProvinceId(data[0]?.id || null)
    }
  }

  const loadLocalUnits = async (provinceId: number | null) => {
    if (!provinceId) {
      setLocalUnits([])
      return
    }

    const response = await fetch(`/api/admin/districts?provinceId=${provinceId}`, { cache: 'no-store' })
    const data = (await response.json()) as LocalUnit[]
    setLocalUnits(data)
  }

  useEffect(() => {
    void loadCountries()
  }, [])

  useEffect(() => {
    void loadProvinces(selectedCountryId)
  }, [selectedCountryId])

  useEffect(() => {
    void loadLocalUnits(selectedProvinceId)
  }, [selectedProvinceId])

  const createCountry = async (event: FormEvent) => {
    event.preventDefault()
    const response = await fetch('/api/admin/countries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(countryForm),
    })

    if (!response.ok) {
      setStatus('Create country failed.')
      return
    }

    setCountryForm(emptyCountry)
    setStatus('Country created.')
    await loadCountries()
  }

  const createProvince = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedCountryId) {
      setStatus('Select a country first.')
      return
    }

    const response = await fetch('/api/admin/provinces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...provinceForm, countryId: selectedCountryId }),
    })

    if (!response.ok) {
      setStatus('Create province failed.')
      return
    }

    setProvinceForm(emptyProvince)
    setStatus('Province created.')
    await loadProvinces(selectedCountryId)
    await loadCountries()
  }

  const createLocalUnit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProvinceId) {
      setStatus('Select a province first.')
      return
    }

    const response = await fetch('/api/admin/districts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...localUnitForm, provinceId: selectedProvinceId }),
    })

    if (!response.ok) {
      setStatus('Create local unit failed.')
      return
    }

    setLocalUnitForm(emptyLocalUnit)
    setStatus('Local unit created.')
    await loadLocalUnits(selectedProvinceId)
    await loadProvinces(selectedCountryId)
  }

  const removeCountry = async (id: number) => {
    const response = await fetch(`/api/admin/countries/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setStatus('Delete country failed.')
      return
    }
    setStatus('Country deleted.')
    await loadCountries()
  }

  const removeProvince = async (id: number) => {
    const response = await fetch(`/api/admin/provinces/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setStatus('Delete province failed.')
      return
    }
    setStatus('Province deleted.')
    await loadProvinces(selectedCountryId)
    await loadCountries()
  }

  const removeLocalUnit = async (id: number) => {
    const response = await fetch(`/api/admin/districts/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setStatus('Delete local unit failed.')
      return
    }
    setStatus('Local unit deleted.')
    await loadLocalUnits(selectedProvinceId)
    await loadProvinces(selectedCountryId)
  }

  const renameCountry = async (country: Country) => {
    const name = window.prompt('Country name', country.name)
    if (!name) return

    const response = await fetch(`/api/admin/countries/${country.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      setStatus('Update country failed.')
      return
    }

    setStatus('Country updated.')
    await loadCountries()
  }

  const updateCountryBatchSize = async (country: Country) => {
    const value = window.prompt('Unlock batch size for map gameplay', String(country.unlockBatchSize))
    if (!value) return

    const unlockBatchSize = Number(value)
    if (!Number.isInteger(unlockBatchSize) || unlockBatchSize <= 0) {
      setStatus('Batch size must be a positive integer.')
      return
    }

    const response = await fetch(`/api/admin/countries/${country.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unlockBatchSize }),
    })

    if (!response.ok) {
      setStatus('Update batch size failed.')
      return
    }

    setStatus('Batch size updated.')
    await loadCountries()
  }

  const renameProvince = async (province: Province) => {
    const name = window.prompt('Province name', province.name)
    if (!name) return

    const response = await fetch(`/api/admin/provinces/${province.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      setStatus('Update province failed.')
      return
    }

    setStatus('Province updated.')
    await loadProvinces(selectedCountryId)
  }

  const renameLocalUnit = async (localUnit: LocalUnit) => {
    const name = window.prompt('Local unit name', localUnit.name)
    if (!name) return

    const response = await fetch(`/api/admin/districts/${localUnit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      setStatus('Update local unit failed.')
      return
    }

    setStatus('Local unit updated.')
    await loadLocalUnits(selectedProvinceId)
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1>GeoPuzzle Admin</h1>
            <p>Manage level hierarchy: Country -&gt; Province -&gt; District/Ward/City.</p>
          </div>
          <Link className={styles.back} href="/">
            Back to game
          </Link>
        </header>

        <section className={styles.levelGrid}>
          <article className={styles.card}>
            <h2>Level 1 · Country</h2>
            <form className={styles.form} onSubmit={createCountry}>
              <label>
                Slug
                <input required value={countryForm.slug} onChange={(event) => setCountryForm((state) => ({ ...state, slug: event.target.value }))} />
              </label>
              <label>
                Name
                <input required value={countryForm.name} onChange={(event) => setCountryForm((state) => ({ ...state, name: event.target.value }))} />
              </label>
              <label>
                Subtitle
                <input required value={countryForm.subtitle} onChange={(event) => setCountryForm((state) => ({ ...state, subtitle: event.target.value }))} />
              </label>
              <label>
                Color
                <input required value={countryForm.color} onChange={(event) => setCountryForm((state) => ({ ...state, color: event.target.value }))} />
              </label>
              <label>
                Unlock batch size
                <input required value={countryForm.unlockBatchSize} onChange={(event) => setCountryForm((state) => ({ ...state, unlockBatchSize: event.target.value }))} />
              </label>
              <label>
                Latitude
                <input required value={countryForm.lat} onChange={(event) => setCountryForm((state) => ({ ...state, lat: event.target.value }))} />
              </label>
              <label>
                Longitude
                <input required value={countryForm.lng} onChange={(event) => setCountryForm((state) => ({ ...state, lng: event.target.value }))} />
              </label>
              <label className={styles.span2}>
                Fact
                <textarea rows={2} required value={countryForm.fact} onChange={(event) => setCountryForm((state) => ({ ...state, fact: event.target.value }))} />
              </label>
              <div className={styles.buttonRow}>
                <button className={styles.primary} type="submit">Add country</button>
              </div>
            </form>

            <div className={styles.list}>
              {countries.map((country) => (
                <div key={country.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <button className={styles.smallBtn} onClick={() => setSelectedCountryId(country.id)}>
                      {selectedCountryId === country.id ? 'Selected' : 'Select'}
                    </button>
                    <b>{country.name}</b>
                    <div className={styles.buttonRow}>
                      <button className={styles.smallBtn} onClick={() => updateCountryBatchSize(country)}>Batch</button>
                      <button className={styles.smallBtn} onClick={() => renameCountry(country)}>Rename</button>
                      <button className={`${styles.smallBtn} ${styles.danger}`} onClick={() => removeCountry(country.id)}>Delete</button>
                    </div>
                  </div>
                  <p>{country.slug} · {country._count?.provinces || 0} provinces · batch {country.unlockBatchSize}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <h2>Level 2 · Province {selectedCountry ? `(${selectedCountry.name})` : ''}</h2>
            <form className={styles.form} onSubmit={createProvince}>
              <label>
                Slug
                <input required value={provinceForm.slug} onChange={(event) => setProvinceForm((state) => ({ ...state, slug: event.target.value }))} />
              </label>
              <label>
                Name
                <input required value={provinceForm.name} onChange={(event) => setProvinceForm((state) => ({ ...state, name: event.target.value }))} />
              </label>
              <label>
                Subtitle
                <input required value={provinceForm.subtitle} onChange={(event) => setProvinceForm((state) => ({ ...state, subtitle: event.target.value }))} />
              </label>
              <label>
                Color
                <input required value={provinceForm.color} onChange={(event) => setProvinceForm((state) => ({ ...state, color: event.target.value }))} />
              </label>
              <label>
                Latitude
                <input required value={provinceForm.lat} onChange={(event) => setProvinceForm((state) => ({ ...state, lat: event.target.value }))} />
              </label>
              <label>
                Longitude
                <input required value={provinceForm.lng} onChange={(event) => setProvinceForm((state) => ({ ...state, lng: event.target.value }))} />
              </label>
              <label className={styles.span2}>
                Fact
                <textarea rows={2} required value={provinceForm.fact} onChange={(event) => setProvinceForm((state) => ({ ...state, fact: event.target.value }))} />
              </label>
              <div className={styles.buttonRow}>
                <button className={styles.primary} type="submit" disabled={!selectedCountryId}>Add province</button>
              </div>
            </form>

            <div className={styles.list}>
              {provinces.map((province) => (
                <div key={province.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <button className={styles.smallBtn} onClick={() => setSelectedProvinceId(province.id)}>
                      {selectedProvinceId === province.id ? 'Selected' : 'Select'}
                    </button>
                    <b>{province.name}</b>
                    <div className={styles.buttonRow}>
                      <button className={styles.smallBtn} onClick={() => renameProvince(province)}>Rename</button>
                      <button className={`${styles.smallBtn} ${styles.danger}`} onClick={() => removeProvince(province.id)}>Delete</button>
                    </div>
                  </div>
                  <p>{province.slug} · {province._count?.districts || 0} local units</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <h2>Level 3 · District/Ward/City {selectedProvince ? `(${selectedProvince.name})` : ''}</h2>
            <form className={styles.form} onSubmit={createLocalUnit}>
              <label>
                Type
                <select value={localUnitForm.levelType} onChange={(event) => setLocalUnitForm((state) => ({ ...state, levelType: event.target.value as LocalUnitType }))}>
                  <option value="DISTRICT">District</option>
                  <option value="WARD">Ward/Xa</option>
                  <option value="CITY">City</option>
                </select>
              </label>
              <label>
                Name
                <input required value={localUnitForm.name} onChange={(event) => setLocalUnitForm((state) => ({ ...state, name: event.target.value }))} />
              </label>
              <label>
                Slug
                <input required value={localUnitForm.slug} onChange={(event) => setLocalUnitForm((state) => ({ ...state, slug: event.target.value }))} />
              </label>
              <label>
                Subtitle
                <input required value={localUnitForm.subtitle} onChange={(event) => setLocalUnitForm((state) => ({ ...state, subtitle: event.target.value }))} />
              </label>
              <label>
                Color
                <input required value={localUnitForm.color} onChange={(event) => setLocalUnitForm((state) => ({ ...state, color: event.target.value }))} />
              </label>
              <label>
                Latitude
                <input required value={localUnitForm.lat} onChange={(event) => setLocalUnitForm((state) => ({ ...state, lat: event.target.value }))} />
              </label>
              <label>
                Longitude
                <input required value={localUnitForm.lng} onChange={(event) => setLocalUnitForm((state) => ({ ...state, lng: event.target.value }))} />
              </label>
              <label className={styles.span2}>
                Fact
                <textarea rows={2} required value={localUnitForm.fact} onChange={(event) => setLocalUnitForm((state) => ({ ...state, fact: event.target.value }))} />
              </label>
              <div className={styles.buttonRow}>
                <button className={styles.primary} type="submit" disabled={!selectedProvinceId}>Add local unit</button>
              </div>
            </form>

            <div className={styles.list}>
              {localUnits.map((localUnit) => (
                <div key={localUnit.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <b>{localUnit.name}</b>
                    <div className={styles.buttonRow}>
                      <button className={styles.smallBtn} onClick={() => renameLocalUnit(localUnit)}>Rename</button>
                      <button className={`${styles.smallBtn} ${styles.danger}`} onClick={() => removeLocalUnit(localUnit.id)}>Delete</button>
                    </div>
                  </div>
                  <p>{localUnit.levelType} · {localUnit.slug}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <p className={styles.note}>{status}</p>
      </div>
    </main>
  )
}
