'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { RotateCcw } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

/* ---------- Presets ---------- */

const presets = {
  neapolitan: { hydration: 62.5, salt: 3, yeast: 0.1, oil: 3 },
  newYork: { hydration: 65, salt: 2.2, yeast: 0.3, oil: 2 },
  roman: { hydration: 75, salt: 2, yeast: 0.2, oil: 3 },
  detroit: { hydration: 72, salt: 2.5, yeast: 0.1, oil: 5 },
}

type PresetName = keyof typeof presets

type DoughResults = {
  earliest: Date | null
  target: Date | null
  latest: Date | null
  totalFlour: number
  totalWater: number
  prefermentFlour: number
  prefermentWater: number
  prefermentYeast: number
  bigaFlour: number
  bigaWater: number
  bigaYeast: number
  remainingFlour: number
  remaining00Flour: number
  remainingBreadFlour: number
  remainingWholeFlour: number
  remainingWholeGrain: number
  remainingWater: number
  salt: number
  dmp: number
  oil: number
  finalYeast: number
  totalDoughWeight: number
  doughBallWeight: number
  doughBallCount: number
  flour00Grams: number
  breadFlourGrams: number
  wholeFlourGrams: number
  wholeGrainGrams: number
}

/* ---------- Constants ---------- */

const PREFERMENT_FLOUR_PERCENT = 50
const BIGA_HYDRATION = 0.45
const POOLISH_HYDRATION = 1
const DMP_PERCENT = 0.01

const BIGA_EARLIEST_HOURS = 14
const BIGA_TARGET_HOURS = 13
const BIGA_LATEST_HOURS = 12

/* ---------- Helpers ---------- */

function roundGrams(value: number): number {
  return Math.round(value)
}

function autoYeastForBiga(hours: number, tempC: number): number {
  const base = 0.1
  const timeFactor = 14 / hours
  const tempFactor = tempC / 22
  const percent = base * timeFactor * tempFactor
  return Number(Math.min(Math.max(percent, 0.08), 0.12).toFixed(3))
}

export default function DoughCalculator() {
  const searchParams = useSearchParams()
  const styleParam = searchParams.get('style')

  const [activePreset, setActivePreset] = useState<PresetName>('neapolitan')

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [balls, setBalls] = useState<number | null>(null)
  const [doughBallWeight, setDoughBallWeight] = useState<number | null>(null)
  const [preferment, setPreferment] = useState<'biga' | 'poolish'>('biga')
  const [roomTemp, setRoomTemp] = useState<number | null>(null)
  const [flour00, setFlour00] = useState<number | null>(null)
  const [breadFlour, setBreadFlour] = useState<number | null>(null)
  const [wholeFlour, setWholeFlour] = useState<number | null>(null)
  const [wholeGrain, setWholeGrain] = useState<number | null>(null)

  const [results, setResults] = useState<DoughResults | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!styleParam) return

    let matchedPreset: PresetName | null = null
    if (styleParam === 'neapolitan') matchedPreset = 'neapolitan'
    else if (styleParam === 'new-york' || styleParam === 'newYork') matchedPreset = 'newYork'
    else if (styleParam === 'roman') matchedPreset = 'roman'
    else if (styleParam === 'detroit') matchedPreset = 'detroit'

    if (matchedPreset) {
      setActivePreset(matchedPreset)
      setResults(null)
      setError('')
    }
  }, [styleParam])

  const activeStyleDough = presets[activePreset]
  const hydration = activeStyleDough.hydration
  const saltPercent = activeStyleDough.salt
  const oilPercent = activeStyleDough.oil
  const yeastPercent = activeStyleDough.yeast

  const calculateAll = () => {
    setError('')
    setResults(null)

    if (
      balls === null ||
      balls < 1 ||
      doughBallWeight === null ||
      doughBallWeight <= 0 ||
      roomTemp === null ||
      flour00 === null ||
      breadFlour === null ||
      wholeFlour === null ||
      wholeGrain === null
    ) {
      setError('Please complete all required fields before calculating.')
      return
    }

    if (flour00 < 0 || breadFlour < 0 || wholeFlour < 0 || wholeGrain < 0) {
      setError('Flour percentages cannot be negative.')
      return
    }

    const blendTotal = flour00 + breadFlour + wholeFlour + wholeGrain

    if (blendTotal <= 0) {
      setError('Please enter at least one flour percentage.')
      return
    }

    const totalDoughWeight = balls * doughBallWeight

    const hydrationRatio = hydration / 100
    const saltRatio = saltPercent / 100
    const oilRatio = oilPercent / 100
    const yeastRatio = yeastPercent / 100

    const doughWeightPerGramFlour = 1 + hydrationRatio + saltRatio + oilRatio + yeastRatio

    const totalFlour = roundGrams(totalDoughWeight / doughWeightPerGramFlour)

    const flour00Grams = roundGrams(totalFlour * (flour00 / blendTotal))
    const breadFlourGrams = roundGrams(totalFlour * (breadFlour / blendTotal))
    const wholeFlourGrams = roundGrams(totalFlour * (wholeFlour / blendTotal))
    const wholeGrainGrams = roundGrams(totalFlour * (wholeGrain / blendTotal))

    const prefermentFlour = roundGrams(totalFlour * (PREFERMENT_FLOUR_PERCENT / 100))

    if (prefermentFlour > flour00Grams) {
      setError(
        `Not enough 00 flour for the ${preferment === 'biga' ? 'BIGA' : 'Poolish'}. Your blend provides ${flour00Grams} g of 00 flour, but the 50% preferment requires ${prefermentFlour} g.`
      )
      return
    }

    const prefermentHydration = preferment === 'biga' ? BIGA_HYDRATION : POOLISH_HYDRATION
    const prefermentWater = roundGrams(prefermentFlour * prefermentHydration)
    const prefermentYeastPercent =
      preferment === 'biga' ? autoYeastForBiga(BIGA_TARGET_HOURS, roomTemp) : 0
    const prefermentYeast =
      preferment === 'biga' ? prefermentFlour * (prefermentYeastPercent / 100) : 0

    const remainingFlour = roundGrams(totalFlour - prefermentFlour)
    const remaining00Flour = Math.max(0, flour00Grams - prefermentFlour)
    const remainingBreadFlour = breadFlourGrams
    const remainingWholeFlour = wholeFlourGrams
    const remainingWholeGrain = wholeGrainGrams

    const totalWater = roundGrams(totalFlour * hydrationRatio)
    const remainingWater = roundGrams(totalWater - prefermentWater)

    const salt = roundGrams(totalFlour * saltRatio)
    const dmp = roundGrams(totalFlour * DMP_PERCENT)
    const oil = roundGrams(totalFlour * oilRatio)
    const finalYeast = 0

    let earliest: Date | null = null
    let target: Date | null = null
    let latest: Date | null = null

    if (date && time) {
      const [year, month, day] = date.split('-').map(Number)
      const [hours, minutes] = time.split(':').map(Number)
      const finalDate = new Date(year, month - 1, day, hours, minutes, 0, 0)

      earliest = new Date(finalDate.getTime() - BIGA_EARLIEST_HOURS * 60 * 60 * 1000)
      target = new Date(finalDate.getTime() - BIGA_TARGET_HOURS * 60 * 60 * 1000)
      latest = new Date(finalDate.getTime() - BIGA_LATEST_HOURS * 60 * 60 * 1000)
    }

    setResults({
      earliest,
      target,
      latest,
      totalFlour,
      totalWater,
      prefermentFlour,
      prefermentWater,
      prefermentYeast,
      bigaFlour: prefermentFlour,
      bigaWater: prefermentWater,
      bigaYeast: prefermentYeast,
      remainingFlour,
      remaining00Flour,
      remainingBreadFlour,
      remainingWholeFlour,
      remainingWholeGrain,
      remainingWater,
      salt,
      dmp,
      oil,
      finalYeast,
      totalDoughWeight,
      doughBallWeight,
      doughBallCount: balls,
      flour00Grams,
      breadFlourGrams,
      wholeFlourGrams,
      wholeGrainGrams,
    })
  }

  const canCalculate =
    balls !== null &&
    balls >= 1 &&
    doughBallWeight !== null &&
    doughBallWeight > 0 &&
    roomTemp !== null &&
    flour00 !== null &&
    breadFlour !== null &&
    wholeFlour !== null &&
    wholeGrain !== null &&
    flour00 >= 0 &&
    breadFlour >= 0 &&
    wholeFlour >= 0 &&
    wholeGrain >= 0 &&
    flour00 + breadFlour + wholeFlour + wholeGrain > 0

  const presetDisplayName =
    activePreset === 'newYork'
      ? 'New York'
      : activePreset.charAt(0).toUpperCase() + activePreset.slice(1)

  const resetCalculator = () => {
    setDate('')
    setTime('')
    setBalls(null)
    setDoughBallWeight(null)
    setPreferment('biga')
    setRoomTemp(null)
    setFlour00(null)
    setBreadFlour(null)
    setWholeFlour(null)
    setWholeGrain(null)
    setResults(null)
    setError('')
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dough Calculator</p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {presetDisplayName} Dough
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your batch parameters using standard form fields.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={resetCalculator}>
          <RotateCcw className="mr-2 size-4" />
          Reset
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-medium">{presetDisplayName} Style Recipe</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
                  <span className="text-xs text-muted-foreground">Hydration</span>
                  <p className="font-medium">{hydration}%</p>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
                  <span className="text-xs text-muted-foreground">Salt</span>
                  <p className="font-medium">{saltPercent}%</p>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
                  <span className="text-xs text-muted-foreground">Oil</span>
                  <p className="font-medium">{oilPercent}%</p>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
                  <span className="text-xs text-muted-foreground">Yeast</span>
                  <p className="font-medium">{yeastPercent}%</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="balls">Number of Dough Balls</Label>
                <Input
                  id="balls"
                  type="number"
                  value={balls ?? ''}
                  min={1}
                  placeholder="e.g. 4"
                  onChange={e => setBalls(e.target.value === '' ? null : Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Total quantity of individual dough portions.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ballWeight">Dough Ball Weight (g)</Label>
                <Input
                  id="ballWeight"
                  type="number"
                  value={doughBallWeight ?? ''}
                  min={1}
                  placeholder="e.g. 275"
                  onChange={e =>
                    setDoughBallWeight(e.target.value === '' ? null : Number(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Standard target weight per individual ball.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preferment Type</Label>
                <Tabs
                  value={preferment}
                  onValueChange={value => {
                    if (value === 'biga' || value === 'poolish') {
                      setPreferment(value)
                      setResults(null)
                      setError('')
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="biga">Biga</TabsTrigger>
                    <TabsTrigger value="poolish">Poolish</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="font-medium capitalize">{preferment}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Uses 50% of total flour with 00 flour only. Hydration:{' '}
                  {preferment === 'biga' ? '45%' : '100%'}.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Target window: {BIGA_LATEST_HOURS}–{BIGA_EARLIEST_HOURS} hours.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomTemp">Room Temperature (°C)</Label>
                <Input
                  id="roomTemp"
                  type="number"
                  value={roomTemp ?? ''}
                  placeholder="e.g. 22"
                  onChange={e => setRoomTemp(e.target.value === '' ? null : Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Used directly by the Biga yeast calculation.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Flour Blend (Percentages)</Label>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flour00">00 Flour</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">%</span>
                    <Input
                      id="flour00"
                      type="number"
                      value={flour00 ?? ''}
                      placeholder="e.g. 90"
                      min={0}
                      className="pl-8"
                      onChange={e =>
                        setFlour00(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breadFlour">Bread Flour</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">%</span>
                    <Input
                      id="breadFlour"
                      type="number"
                      value={breadFlour ?? ''}
                      placeholder="e.g. 5"
                      min={0}
                      className="pl-8"
                      onChange={e =>
                        setBreadFlour(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholeFlour">Whole Wheat</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">%</span>
                    <Input
                      id="wholeFlour"
                      type="number"
                      value={wholeFlour ?? ''}
                      placeholder="e.g. 5"
                      min={0}
                      className="pl-8"
                      onChange={e =>
                        setWholeFlour(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholeGrain">Whole Grain</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">%</span>
                    <Input
                      id="wholeGrain"
                      type="number"
                      value={wholeGrain ?? ''}
                      placeholder="e.g. 0"
                      min={0}
                      className="pl-8"
                      onChange={e =>
                        setWholeGrain(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">Target baking completion date.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  disabled={!date}
                  className={!date ? 'opacity-50' : ''}
                />
                <p className="text-xs text-muted-foreground">Target baking completion time.</p>
              </div>
            </div>

            {error && (
              <div
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button onClick={calculateAll} disabled={!canCalculate} className="w-full" size="lg">
              Calculate Everything
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Hydration</p>
                  <p className="mt-1 text-xl font-semibold">{hydration}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Salt</p>
                  <p className="mt-1 text-xl font-semibold">{saltPercent}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Oil</p>
                  <p className="mt-1 text-xl font-semibold">{oilPercent}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Preferment</p>
                  <p className="mt-1 text-xl font-semibold">50%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Biga Start Window</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span>Earliest (14h)</span>
                  <strong>
                    {results.earliest ? format(results.earliest, 'MMM d, yyyy @ HH:mm') : '—'}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span>Target (13h)</span>
                  <strong>
                    {results.target ? format(results.target, 'MMM d, yyyy @ HH:mm') : '—'}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span>Latest (12h)</span>
                  <strong>
                    {results.latest ? format(results.latest, 'MMM d, yyyy @ HH:mm') : '—'}
                  </strong>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {results && (
        <section className="mt-10 space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Results</p>
            <h2 className="text-2xl font-bold tracking-tight">Calculated Dough Specs</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Dough
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{results.totalDoughWeight} g</p>
                <p className="text-xs text-muted-foreground">
                  {results.doughBallCount} × {results.doughBallWeight} g
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Flour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{results.totalFlour} g</p>
                <p className="text-xs text-muted-foreground">100% flour basis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Water
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{results.totalWater} g</p>
                <p className="text-xs text-muted-foreground">{hydration}% hydration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Room Temp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{roomTemp}°C</p>
                <p className="text-xs text-muted-foreground">Used for Biga yeast</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  )
}
