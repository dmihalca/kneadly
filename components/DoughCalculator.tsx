'use client'

import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { format } from 'date-fns'

/* ---------- Presets ---------- */

const presets = {
  neapolitan: {
    hydration: 62.5,
    salt: 3,
    yeast: 0.1,
    oil: 3,
  },
  newYork: {
    hydration: 65,
    salt: 2.2,
    yeast: 0.3,
    oil: 2,
  },
  roman: {
    hydration: 75,
    salt: 2,
    yeast: 0.2,
    oil: 3,
  },
  detroit: {
    hydration: 72,
    salt: 2.5,
    yeast: 0.1,
    oil: 5,
  },
}

type PresetName = keyof typeof presets

/* ---------- Types ---------- */

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

/*
 * BIGA is always made from 50% of the total flour
 * and uses 00 flour only.
 */
const PREFERMENT_FLOUR_PERCENT = 50
const BIGA_HYDRATION = 0.45
const POOLISH_HYDRATION = 1

/*
 * Diastatic Malt Powder percentage.
 */
const DMP_PERCENT = 0.01

/*
 * BIGA fermentation window:
 *
 * 14h = earliest start
 * 13h = target
 * 12h = latest start
 */
const BIGA_EARLIEST_HOURS = 14
const BIGA_TARGET_HOURS = 13
const BIGA_LATEST_HOURS = 12

/* ---------- Helpers ---------- */

function roundGrams(value: number): number {
  return Math.round(value)
}

/* ---------- Auto yeast for BIGA ONLY ---------- */

function autoYeastForBiga(hours: number, tempC: number): number {
  const base = 0.1

  /*
   * 14h is the upper end of the 12–14h BIGA window.
   * The target fermentation time is 13h.
   */
  const timeFactor = 14 / hours

  /*
   * Temperature adjustment.
   */
  const tempFactor = tempC / 22

  const percent = base * timeFactor * tempFactor

  return Number(Math.min(Math.max(percent, 0.08), 0.12).toFixed(3))
}

/* ---------- Component ---------- */

export default function DoughCalculator() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  /*
   * User inputs intentionally start empty.
   */
  const [balls, setBalls] = useState<number | null>(null)

  const [doughBallWeight, setDoughBallWeight] = useState<number | null>(null)

  const [preferment, setPreferment] = useState<'biga' | 'poolish'>('biga')

  const [roomTemp, setRoomTemp] = useState<number | null>(null)

  const [flour00, setFlour00] = useState<number | null>(null)

  const [breadFlour, setBreadFlour] = useState<number | null>(null)

  const [wholeFlour, setWholeFlour] = useState<number | null>(null)

  const [wholeGrain, setWholeGrain] = useState<number | null>(null)

  /*
   * The active preset is the source of:
   * hydration, salt, yeast and oil.
   */
  const [activePreset, setActivePreset] = useState<PresetName>('neapolitan')

  const [results, setResults] = useState<DoughResults | null>(null)

  const [error, setError] = useState('')

  const activeStyleDough = presets[activePreset]

  const hydration = activeStyleDough.hydration
  const saltPercent = activeStyleDough.salt
  const oilPercent = activeStyleDough.oil
  const yeastPercent = activeStyleDough.yeast

  /* ---------- Apply preset ---------- */

  const applyPreset = (name: PresetName) => {
    setActivePreset(name)
    setResults(null)
    setError('')
  }

  /* ---------- Main calculation ---------- */

  const calculateAll = () => {
    setError('')
    setResults(null)

    /*
     * Validate required user inputs.
     */
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

    /*
     * Flour percentages cannot be negative.
     */
    if (flour00 < 0 || breadFlour < 0 || wholeFlour < 0 || wholeGrain < 0) {
      setError('Flour percentages cannot be negative.')
      return
    }

    /*
     * The calculator normalizes the flour blend,
     * so the percentages do not have to add up
     * exactly to 100%.
     */
    const blendTotal = flour00 + breadFlour + wholeFlour + wholeGrain

    if (blendTotal <= 0) {
      setError('Please enter at least one flour percentage.')
      return
    }

    /* ---------- Dough weight ---------- */

    /*
     * Desired final dough weight.
     *
     * Example:
     * 4 × 275 g = 1100 g total dough
     */
    const totalDoughWeight = balls * doughBallWeight

    /* ---------- Flour calculation ---------- */

    /*
     * Instead of using an arbitrary base flour value
     * such as 640 g, calculate the required flour from
     * the actual baker's percentages of the active recipe.
     *
     * Example for Neapolitan:
     *
     * Flour      = 100%
     * Water      = 62.5%
     * Salt       = 3%
     * Oil        = 3%
     * Yeast      = 0.1%
     *
     * Total dough per 1 g flour:
     *
     * 1 + 0.625 + 0.03 + 0.03 + 0.001
     * = 1.686 g dough
     *
     * Therefore:
     *
     * 1100 / 1.686
     * = 652.43 g flour
     */

    const hydrationRatio = hydration / 100

    const saltRatio = saltPercent / 100

    const oilRatio = oilPercent / 100

    const yeastRatio = yeastPercent / 100

    const doughWeightPerGramFlour = 1 + hydrationRatio + saltRatio + oilRatio + yeastRatio

    const totalFlour = roundGrams(totalDoughWeight / doughWeightPerGramFlour)

    /* ---------- Flour blend ---------- */

    /*
     * Distribute the calculated total flour
     * according to the user's flour blend.
     */
    const flour00Grams = roundGrams(totalFlour * (flour00 / blendTotal))

    const breadFlourGrams = roundGrams(totalFlour * (breadFlour / blendTotal))

    const wholeFlourGrams = roundGrams(totalFlour * (wholeFlour / blendTotal))

    const wholeGrainGrams = roundGrams(totalFlour * (wholeGrain / blendTotal))

    /* ---------- Preferment ---------- */

    /*
     * BIGA is always 50% of total flour.
     */
    const prefermentFlour = roundGrams(totalFlour * (PREFERMENT_FLOUR_PERCENT / 100))

    if (prefermentFlour > flour00Grams) {
      setError(
        `Not enough 00 flour for the ${preferment === 'biga' ? 'BIGA' : 'Poolish'}. Your blend provides ${flour00Grams} g of 00 flour, but the 50% preferment requires ${prefermentFlour} g. Increase your 00 flour percentage.`
      )
      return
    }

    const prefermentHydration = preferment === 'biga' ? BIGA_HYDRATION : POOLISH_HYDRATION
    const prefermentWater = roundGrams(prefermentFlour * prefermentHydration)
    const prefermentYeastPercent =
      preferment === 'biga' ? autoYeastForBiga(BIGA_TARGET_HOURS, roomTemp) : 0
    const prefermentYeast =
      preferment === 'biga' ? prefermentFlour * (prefermentYeastPercent / 100) : 0

    const bigaFlour = prefermentFlour
    const bigaWater = prefermentWater
    const bigaYeast = prefermentYeast

    /*
     * BIGA must use 00 flour only.
     *
     * If the user's 00 flour percentage is too low,
     * show a useful error instead of silently failing.
     */

    /* ---------- Remaining ingredients ---------- */

    const remainingFlour = roundGrams(totalFlour - prefermentFlour)

    /*
     * BIGA uses 00 flour only.
     */
    const remaining00Flour = Math.max(0, flour00Grams - prefermentFlour)

    /*
     * Other flour types are not used in the BIGA,
     * so their entire calculated amount remains.
     */
    const remainingBreadFlour = breadFlourGrams

    const remainingWholeFlour = wholeFlourGrams

    const remainingWholeGrain = wholeGrainGrams

    /* ---------- Water ---------- */

    const totalWater = roundGrams(totalFlour * hydrationRatio)

    const remainingWater = roundGrams(totalWater - prefermentWater)

    /* ---------- Other ingredients ---------- */

    const salt = roundGrams(totalFlour * saltRatio)

    /*
     * DMP rounded to nearest whole gram.
     */
    const dmp = roundGrams(totalFlour * DMP_PERCENT)

    /*
     * Olive oil rounded to nearest whole gram.
     */
    const oil = roundGrams(totalFlour * oilRatio)

    /*
     * Final yeast is currently zero because the yeast
     * calculation is handled specifically for BIGA.
     */
    const finalYeast = 0

    /* ---------- BIGA start window ---------- */

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

    /* ---------- Store results ---------- */

    setResults({
      earliest,
      target,
      latest,
      totalFlour,
      totalWater,
      prefermentFlour,
      prefermentWater,
      prefermentYeast,
      bigaFlour,
      bigaWater,
      bigaYeast,
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

  /* ---------- Validation ---------- */

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

  /* ---------- Preset display name ---------- */

  const presetDisplayName =
    activePreset === 'newYork'
      ? 'New York'
      : activePreset.charAt(0).toUpperCase() + activePreset.slice(1)

  /* ---------- Render ---------- */

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Doughy</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* PRESETS */}

          <div className="space-y-2">
            <Label className="mb-4">Preset Styles</Label>

            <Tabs
              value={activePreset}
              onValueChange={value => {
                if (value in presets) {
                  applyPreset(value as PresetName)
                }
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="neapolitan">Neapolitan</TabsTrigger>

                <TabsTrigger value="newYork">New York</TabsTrigger>

                <TabsTrigger value="roman">Roman</TabsTrigger>

                <TabsTrigger value="detroit">Detroit</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* BIGA SETTINGS */}

          <div className="space-y-2">
            <Label className="mb-4">Preferment</Label>
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
                <TabsTrigger value="biga">BIGA</TabsTrigger>
                <TabsTrigger value="poolish">Poolish</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm font-medium">{preferment === 'biga' ? 'BIGA' : 'Poolish'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Uses 50% of total flour with 00 flour only.
              </p>
              <p className="text-sm text-muted-foreground">
                Hydration: {preferment === 'biga' ? '45%' : '100%'}
              </p>
            </div>

            <Label>{preferment === 'biga' ? 'Biga' : 'Poolish'} Fermentation Time</Label>

            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm">
                Target: <strong>{BIGA_TARGET_HOURS} hours</strong>
              </p>

              <p className="text-sm text-muted-foreground">
                Recommended window: {BIGA_LATEST_HOURS}–{BIGA_EARLIEST_HOURS} hours
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                Preferment flour: {PREFERMENT_FLOUR_PERCENT}% of total flour
              </p>
            </div>

            <Label>Room Temperature (°C)</Label>

            <Input
              type="number"
              value={roomTemp ?? ''}
              placeholder="e.g. 22"
              onChange={e => setRoomTemp(e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>

          {/* FLOUR BLEND */}

          <div className="space-y-2">
            <Label className="mb-4">Flour Blend (percentages)</Label>

            <div className="grid grid-cols-2 gap-3">
              {/* 00 FLOUR */}

              <div>
                <Label>00 Flour</Label>

                <div className="relative">
                  <span className="absolute left-0 top-2.5 text-muted-foreground font-medium">
                    %
                  </span>

                  <Input
                    type="number"
                    value={flour00 ?? ''}
                    placeholder="e.g. 90"
                    min={0}
                    onChange={e =>
                      setFlour00(e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="pl-6"
                  />
                </div>
              </div>

              {/* BREAD FLOUR */}

              <div>
                <Label>Bread Flour</Label>

                <div className="relative">
                  <span className="absolute left-0 top-2.5 text-muted-foreground font-medium">
                    %
                  </span>

                  <Input
                    type="number"
                    value={breadFlour ?? ''}
                    placeholder="e.g. 5"
                    min={0}
                    onChange={e =>
                      setBreadFlour(e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="pl-6"
                  />
                </div>
              </div>

              {/* WHOLE WHEAT */}

              <div>
                <Label>Whole Wheat</Label>

                <div className="relative">
                  <span className="absolute left-0 top-2.5 text-muted-foreground font-medium">
                    %
                  </span>

                  <Input
                    type="number"
                    value={wholeFlour ?? ''}
                    placeholder="e.g. 5"
                    min={0}
                    onChange={e =>
                      setWholeFlour(e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="pl-6"
                  />
                </div>
              </div>

              {/* WHOLE GRAIN */}

              <div>
                <Label>Whole Grain</Label>

                <div className="relative">
                  <span className="absolute left-0 top-2.5 text-muted-foreground font-medium">
                    %
                  </span>

                  <Input
                    type="number"
                    value={wholeGrain ?? ''}
                    placeholder="e.g. 0"
                    min={0}
                    onChange={e =>
                      setWholeGrain(e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="pl-6"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DATE + TIME */}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Date</Label>

              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            <div className="flex-1">
              <Label>Time</Label>

              <Input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={!date}
                className={`w-full ${!date ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* DOUGH BALLS */}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Number of dough balls</Label>
              <Input
                type="number"
                value={balls ?? ''}
                min={1}
                placeholder="e.g. 4"
                onChange={e => setBalls(e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Dough ball weight (g)</Label>
              <Input
                type="number"
                value={doughBallWeight ?? ''}
                min={1}
                placeholder="e.g. 275"
                onChange={e =>
                  setDoughBallWeight(e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
          </div>

          {/* ACTIVE STYLE DOUGH */}

          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-sm font-medium">{presetDisplayName} Style Dough</p>

            <div className="grid grid-cols-4 gap-2 mt-2 text-sm">
              <div>
                <span className="text-muted-foreground">Hydration</span>
                <p className="font-medium">{hydration}%</p>
              </div>

              <div>
                <span className="text-muted-foreground">Salt</span>
                <p className="font-medium">{saltPercent}%</p>
              </div>

              <div>
                <span className="text-muted-foreground">Oil</span>
                <p className="font-medium">{oilPercent}%</p>
              </div>

              <div>
                <span className="text-muted-foreground">Yeast</span>
                <p className="font-medium">{yeastPercent}%</p>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* CALCULATE */}

          <Button onClick={calculateAll} disabled={!canCalculate} className="w-full">
            Calculate Everything
          </Button>

          {results && (
            <>
              <Separator className="my-4" />

              {/* BIGA TIME */}

              <div className="space-y-3 border rounded-md p-4 bg-muted/30">
                <h3 className="text-lg font-semibold">
                  {preferment === 'biga' ? 'BIGA' : 'Poolish'} Start Time
                </h3>

                <div className="flex items-center justify-between">
                  <span>Earliest (14h)</span>

                  <strong>
                    {results.earliest ? format(results.earliest, 'MMM d, yyyy @ HH:mm') : '—'}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Target (13h)</span>

                  <strong>
                    {results.target ? format(results.target, 'MMM d, yyyy @ HH:mm') : '—'}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Latest (12h)</span>

                  <strong>
                    {results.latest ? format(results.latest, 'MMM d, yyyy @ HH:mm') : '—'}
                  </strong>
                </div>
              </div>

              <Separator />

              {/* BIGA */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {preferment === 'biga' ? 'BIGA' : 'Poolish'} (13h target @ {roomTemp}°C)
                </h3>

                <p>
                  {preferment === 'biga' ? 'BIGA' : 'Poolish'} flour: {results.prefermentFlour} g
                </p>

                <p>
                  {preferment === 'biga' ? 'BIGA' : 'Poolish'} water: {results.prefermentWater} g
                </p>

                {preferment === 'biga' && <p>BIGA yeast: {results.prefermentYeast.toFixed(3)} g</p>}
              </div>

              <Separator />

              {/* FLOUR BREAKDOWN */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Flour Breakdown</h3>

                {flour00 !== null && flour00 > 0 && <p>00 Flour: {results.flour00Grams} g</p>}

                {breadFlour !== null && breadFlour > 0 && (
                  <p>Bread Flour: {results.breadFlourGrams} g</p>
                )}

                {wholeFlour !== null && wholeFlour > 0 && (
                  <p>Whole Wheat: {results.wholeFlourGrams} g</p>
                )}

                {wholeGrain !== null && wholeGrain > 0 && (
                  <p>Whole Grain: {results.wholeGrainGrams} g</p>
                )}
              </div>

              <Separator />
              {/* REMAINING INGREDIENTS */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Remaining Ingredients</h3>

                {flour00 !== null && flour00 > 0 && (
                  <p>Remaining 00 Flour: {results.remaining00Flour} g</p>
                )}

                {breadFlour !== null && breadFlour > 0 && (
                  <p>Remaining Bread Flour: {results.remainingBreadFlour} g</p>
                )}

                {wholeFlour !== null && wholeFlour > 0 && (
                  <p>Remaining Whole Wheat: {results.remainingWholeFlour} g</p>
                )}

                {wholeGrain !== null && wholeGrain > 0 && (
                  <p>Remaining Whole Grain: {results.remainingWholeGrain} g</p>
                )}

                <p>Remaining water: {results.remainingWater} g</p>

                <p>Salt: {results.salt} g</p>

                <p>Diastatic Malt Powder: {results.dmp} g</p>

                <p>Olive oil: {results.oil} g</p>
              </div>

              <Separator />

              {/* TOTALS */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Totals</h3>

                <p>Total dough weight: {results.totalDoughWeight} g</p>

                <p>Total flour: {results.totalFlour.toFixed(1)} g</p>

                <p>Total water: {(results.bigaWater + results.remainingWater).toFixed(1)} g</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
