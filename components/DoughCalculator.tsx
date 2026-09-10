'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'

/* ---------- Types ---------- */

type DoughResults = {
  earliest: Date | null
  target: Date | null
  latest: Date | null
  totalFlour: number
  bigaFlour: number
  bigaWater: number
  bigaYeast: number
  remainingFlour: number
  remainingWater: number
  salt: number
  dmp: number
  oil: number
  finalYeast: number
  totalDoughWeight: number
  flour00Grams: number
  breadFlourGrams: number
  wholeFlourGrams: number
  wholeGrainGrams: number
}

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
  focaccia: {
    hydration: 80,
    salt: 2,
    yeast: 0.2,
    oil: 8,
  },
}

/* ---------- Helpers ---------- */

/**
 * Rounds ingredient weights to the nearest whole gram.
 * Values below .5 round down; .5 and above round up.
 */
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
   * Keep the existing temperature adjustment.
   */
  const tempFactor = tempC / 22

  const percent = base * timeFactor * tempFactor

  return Number(Math.min(Math.max(percent, 0.08), 0.12).toFixed(3))
}

/* ---------- Component ---------- */

export default function DoughCalculator() {
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')

  const [balls, setBalls] = useState<number>(4)

  const [hydration, setHydration] = useState<number>(62.5)
  const [saltPercent, setSaltPercent] = useState<number>(3)
  const [oilPercent, setOilPercent] = useState<number>(2)

  const [roomTemp, setRoomTemp] = useState<number>(22)

  const [flour00, setFlour00] = useState<number>(90)
  const [breadFlour, setBreadFlour] = useState<number>(5)
  const [wholeFlour, setWholeFlour] = useState<number>(5)
  const [wholeGrain, setWholeGrain] = useState<number>(0)

  const [results, setResults] = useState<DoughResults | null>(null)

  const DOUGH_BALL_WEIGHT = 275
  const BIGA_FLOUR = 300
  const BIGA_HYDRATION = 0.45
  const DMP_PERCENT = 0.01

  /*
   * BIGA fermentation window:
   *
   * 14h = earliest start
   * 13h = target / average
   * 12h = latest start
   */
  const BIGA_EARLIEST_HOURS = 14
  const BIGA_TARGET_HOURS = 13
  const BIGA_LATEST_HOURS = 12

  /* ---------- Apply preset ---------- */

  const applyPreset = (name: keyof typeof presets) => {
    const p = presets[name]

    setHydration(p.hydration)
    setSaltPercent(p.salt)
    setOilPercent(p.oil)
  }

  /* ---------- Main calculation ---------- */

  const calculateAll = () => {
    /*
     * BIGA yeast is calculated from the 13h target.
     * Temperature still affects the yeast percentage.
     */
    const bigaYeastPercent = autoYeastForBiga(BIGA_TARGET_HOURS, roomTemp)

    let earliest: Date | null = null
    let target: Date | null = null
    let latest: Date | null = null

    /* ---------- Calculate BIGA start window ---------- */

    if (date && time) {
      const [year, month, day] = date.split('-').map(Number)

      const [hours, minutes] = time.split(':').map(Number)

      const finalDate = new Date(year, month - 1, day, hours, minutes, 0, 0)

      /*
       * Earliest:
       * Final dough time - 14 hours
       */
      earliest = new Date(finalDate.getTime() - BIGA_EARLIEST_HOURS * 60 * 60 * 1000)

      /*
       * Target:
       * Final dough time - 13 hours
       */
      target = new Date(finalDate.getTime() - BIGA_TARGET_HOURS * 60 * 60 * 1000)

      /*
       * Latest:
       * Final dough time - 12 hours
       */
      latest = new Date(finalDate.getTime() - BIGA_LATEST_HOURS * 60 * 60 * 1000)
    }

    /* ---------- Dough calculations ---------- */

    const totalDoughWeight = balls * DOUGH_BALL_WEIGHT

    const totalFlour = 650 * (totalDoughWeight / 1080)

    const blendTotal = flour00 + breadFlour + wholeFlour + wholeGrain || 1

    const flour00Grams = roundGrams(totalFlour * (flour00 / blendTotal))

    const breadFlourGrams = roundGrams(totalFlour * (breadFlour / blendTotal))

    const wholeFlourGrams = roundGrams(totalFlour * (wholeFlour / blendTotal))

    const wholeGrainGrams = roundGrams(totalFlour * (wholeGrain / blendTotal))

    /* ---------- BIGA ---------- */

    const bigaFlour = roundGrams(BIGA_FLOUR * (totalFlour / 650))

    const bigaWater = roundGrams(bigaFlour * BIGA_HYDRATION)

    const bigaYeast = bigaFlour * (bigaYeastPercent / 100)

    /* ---------- Remaining ingredients ---------- */

    const remainingFlour = roundGrams(totalFlour - bigaFlour)

    const HYDRATION = hydration / 100

    const totalWater = totalFlour * HYDRATION

    const remainingWater = roundGrams(totalWater - bigaWater)

    const salt = roundGrams(totalFlour * (saltPercent / 100))

    const dmp = totalFlour * DMP_PERCENT

    const oil = totalFlour * (oilPercent / 100)

    const finalYeast = 0

    /* ---------- Store results ---------- */

    setResults({
      earliest,
      target,
      latest,
      totalFlour,
      bigaFlour,
      bigaWater,
      bigaYeast,
      remainingFlour,
      remainingWater,
      salt,
      dmp,
      oil,
      finalYeast,
      totalDoughWeight,
      flour00Grams,
      breadFlourGrams,
      wholeFlourGrams,
      wholeGrainGrams,
    })
  }

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

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => applyPreset('neapolitan')}>Neapolitan</Button>

              <Button onClick={() => applyPreset('newYork')}>New York</Button>

              <Button onClick={() => applyPreset('roman')}>Roman</Button>

              <Button onClick={() => applyPreset('focaccia')}>Focaccia</Button>
            </div>
          </div>

          {/* BIGA SETTINGS */}

          <div className="space-y-2">
            <Label>Biga Fermentation Time</Label>

            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm">
                Target: <strong>{BIGA_TARGET_HOURS} hours</strong>
              </p>

              <p className="text-sm text-muted-foreground">
                Recommended window: {BIGA_LATEST_HOURS}–{BIGA_EARLIEST_HOURS} hours
              </p>
            </div>

            <Label>Room Temperature (°C)</Label>

            <Input
              type="number"
              value={roomTemp}
              onChange={e => setRoomTemp(Number(e.target.value))}
            />
          </div>

          {/* FLOUR BLENDS */}

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
                    value={flour00}
                    onChange={e => setFlour00(Number(e.target.value))}
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
                    value={breadFlour}
                    onChange={e => setBreadFlour(Number(e.target.value))}
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
                    value={wholeFlour}
                    onChange={e => setWholeFlour(Number(e.target.value))}
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
                    value={wholeGrain}
                    onChange={e => setWholeGrain(Number(e.target.value))}
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

          <div className="space-y-2">
            <Label>How many dough balls?</Label>

            <Input
              type="number"
              value={balls}
              min={1}
              onChange={e => setBalls(Number(e.target.value))}
            />
          </div>

          {/* HYDRATION */}

          <div className="space-y-2">
            <Label>Hydration (%)</Label>

            <Input
              type="number"
              value={hydration}
              step={0.5}
              min={55}
              max={85}
              onChange={e => setHydration(Number(e.target.value))}
            />
          </div>

          <Button onClick={calculateAll}>Calculate Everything</Button>

          {results && (
            <>
              <Separator className="my-4" />

              {/* BIGA TIME */}

              <div className="space-y-3 border rounded-md p-4 bg-muted/30">
                <h3 className="text-lg font-semibold">Biga Start Time</h3>

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
                <h3 className="text-lg font-semibold">Biga (13h target @ {roomTemp}°C)</h3>

                <p>Biga flour: {results.bigaFlour} g</p>

                <p>Biga water: {results.bigaWater} g</p>

                <p>Biga yeast: {results.bigaYeast.toFixed(3)} g</p>
              </div>

              <Separator />

              {/* FLOUR BREAKDOWN */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Flour Breakdown</h3>

                <p>00 Flour: {results.flour00Grams} g</p>

                <p>Bread Flour: {results.breadFlourGrams} g</p>

                <p>Whole Wheat: {results.wholeFlourGrams} g</p>

                <p>Whole Grain: {results.wholeGrainGrams} g</p>
              </div>

              <Separator />

              {/* TOTALS */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Totals</h3>

                <p>Total dough weight: {results.totalDoughWeight.toFixed(1)} g</p>

                <p>Total flour: {results.totalFlour.toFixed(1)} g</p>

                <p>Total water: {(results.bigaWater + results.remainingWater).toFixed(1)} g</p>
              </div>

              <Separator />

              {/* REMAINING INGREDIENTS */}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Remaining Ingredients</h3>

                <p>Remaining flour: {results.remainingFlour} g</p>

                <p>Remaining water: {results.remainingWater} g</p>

                <p>Salt: {results.salt} g</p>

                <p>Diastatic Malt Powder: {results.dmp.toFixed(1)} g</p>

                <p>Olive oil: {results.oil.toFixed(1)} g</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
