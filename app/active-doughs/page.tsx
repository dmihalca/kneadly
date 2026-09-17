'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

import { useState, useEffect } from 'react'
import { format, addHours, differenceInSeconds } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Play,
  Trash2,
  Layers,
  Calculator,
  ArrowLeft,
  ArrowRight,
  Clock,
  SunMedium,
  AlertCircle,
  Eye,
} from 'lucide-react'

type DoughStage = 'preferment' | 'final_dough' | 'bulk' | 'ball_ferment' | 'room_rest' | 'completed'
const stages: DoughStage[] = [
  'preferment',
  'final_dough',
  'bulk',
  'ball_ferment',
  'room_rest',
  'completed',
]

interface ActiveDough {
  id: string
  preset: string
  preferment: string
  roomTemp: number
  results: {
    totalDoughWeight: number
    doughBallCount: number
    doughBallWeight: number
    totalFlour: number
    totalWater: number
    prefermentFlour?: number
    prefermentWater?: number
    prefermentPercentage?: number
    prefermentHydration?: number
    finalFlour?: number
    finalWater?: number
    salt?: number
    yeast?: number
    prefermentYeast?: number
    oil?: number
    dmp?: number
    [key: string]: any
  }
  startedAt: string
  stage?: DoughStage
  prefermentReadyAt?: string
  bulkReadyAt?: string
  ballFermentReadyAt?: string
  roomRestReadyAt?: string
  prefermentStarted?: boolean
  prefermentDuration?: number
  prefermentCompleted?: boolean
  finalDoughCompleted?: boolean
  bulkStarted?: boolean
  bulkDuration?: number
  bulkCompleted?: boolean
  ballFermentStarted?: boolean
  ballFermentDuration?: number
  ballFermentCompleted?: boolean
  roomRestStarted?: boolean
  roomRestCompleted?: boolean
  isPreviewingFinal?: boolean
}

//
// Hybrid Temperature Activity Model & Preferment Time Engine
//

function tempActivity(tempC: number) {
  if (tempC <= 26) {
    return tempC / 22
  }
  return (tempC / 22) * Math.exp(0.08 * (tempC - 26))
}

export function poolishTimesFromTemp(tempC: number) {
  const base = 0.15
  const ref = 12
  const tempFactor = tempActivity(tempC)

  const yeastMin = 0.3
  const yeastRec = 0.15
  const yeastMax = 0.1

  const min = (base * ref * tempFactor) / yeastMin
  const rec = (base * ref * tempFactor) / yeastRec
  const max = (base * ref * tempFactor) / yeastMax

  return {
    min: Math.round(Math.max(min, 8)),
    recommended: Math.round(Math.min(rec, 16)),
    max: Math.round(Math.min(max, 24)),
  }
}

export function bigaTimesFromTemp(tempC: number) {
  const base = 0.1
  const ref = 14
  const tempFactor = tempActivity(tempC)

  const yeastMin = 0.12
  const yeastRec = 0.1
  const yeastMax = 0.08

  const min = (base * ref * tempFactor) / yeastMin
  const rec = (base * ref * tempFactor) / yeastRec
  const max = (base * ref * tempFactor) / yeastMax

  return {
    min: Math.round(Math.max(min, 10)),
    recommended: Math.round(Math.min(rec, 16)),
    max: Math.round(Math.min(max, 20)),
  }
}

export function getPrefermentTimes(type: 'biga' | 'poolish', tempC: number) {
  return type === 'biga' ? bigaTimesFromTemp(tempC) : poolishTimesFromTemp(tempC)
}

const getPrefermentTimeOptions = (preferment: string, temp: number = 21) => {
  const type = preferment.toLowerCase() === 'poolish' ? 'poolish' : 'biga'
  const times = getPrefermentTimes(type, temp)

  return [
    { label: `Earliest (${times.min}h)`, hours: times.min },
    { label: `Rec. (${times.recommended}h)`, hours: times.recommended },
    { label: `Max (${times.max}h)`, hours: times.max },
  ]
}

export default function ActiveDoughsPage() {
  const [activeDoughs, setActiveDoughs] = useState<ActiveDough[]>([])
  const [confirmModalDoughId, setConfirmModalDoughId] = useState<string | null>(null)
  const [bulkConfirmModalDoughId, setBulkConfirmModalDoughId] = useState<string | null>(null)
  const [ballConfirmModalDoughId, setBallConfirmModalDoughId] = useState<string | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('activeDoughs') || '[]')
    const initialized = saved.map((dough: ActiveDough) => {
      if (dough.prefermentStarted === undefined) dough.prefermentStarted = false
      if (dough.prefermentCompleted === undefined) dough.prefermentCompleted = false
      if (dough.finalDoughCompleted === undefined) dough.finalDoughCompleted = false
      if (dough.bulkStarted === undefined) dough.bulkStarted = false
      if (dough.bulkCompleted === undefined) dough.bulkCompleted = false
      if (dough.ballFermentStarted === undefined) dough.ballFermentStarted = false
      if (dough.ballFermentCompleted === undefined) dough.ballFermentCompleted = false
      if (dough.roomRestStarted === undefined) dough.roomRestStarted = false
      if (dough.roomRestCompleted === undefined) dough.roomRestCompleted = false
      return dough
    })
    setActiveDoughs(initialized)
  }, [])

  const updateStage = (id: string, nextStage: DoughStage) => {
    const now = new Date()
    const updated = activeDoughs.map(dough => {
      if (dough.id === id) {
        const currentStage = dough.stage || 'preferment'
        let prefermentCompleted = dough.prefermentCompleted
        let finalDoughCompleted = dough.finalDoughCompleted
        let bulkCompleted = dough.bulkCompleted
        let ballFermentCompleted = dough.ballFermentCompleted
        let roomRestCompleted = dough.roomRestCompleted
        let roomRestStarted = dough.roomRestStarted

        if (currentStage === 'preferment' && nextStage === 'final_dough') {
          prefermentCompleted = true
        }
        if (currentStage === 'final_dough' && nextStage === 'bulk') {
          finalDoughCompleted = true
        }
        if (currentStage === 'bulk' && nextStage === 'ball_ferment') {
          bulkCompleted = true
        }
        if (currentStage === 'ball_ferment' && nextStage === 'room_rest') {
          ballFermentCompleted = true
        }
        if (currentStage === 'room_rest' && nextStage === 'completed') {
          roomRestCompleted = true
        }

        const updatedDough = {
          ...dough,
          stage: nextStage,
          prefermentCompleted,
          finalDoughCompleted,
          bulkCompleted,
          ballFermentCompleted,
          roomRestCompleted,
          roomRestStarted,
          isPreviewingFinal: false,
        }
        if (nextStage === 'room_rest' && !updatedDough.roomRestReadyAt) {
          updatedDough.roomRestReadyAt = addHours(now, 3).toISOString()
          updatedDough.roomRestStarted = true
        }
        return updatedDough
      }
      return dough
    })
    setActiveDoughs(updated)
    localStorage.setItem('activeDoughs', JSON.stringify(updated))
  }

  const startPrefermentTimer = (id: string, hours: number) => {
    const now = new Date()
    const updated = activeDoughs.map(dough => {
      if (dough.id === id) {
        return {
          ...dough,
          prefermentStarted: true,
          prefermentDuration: hours,
          prefermentReadyAt: addHours(now, hours).toISOString(),
        }
      }
      return dough
    })
    setActiveDoughs(updated)
    localStorage.setItem('activeDoughs', JSON.stringify(updated))
  }

  const startBulkTimer = (id: string, hours: number) => {
    const now = new Date()
    const updated = activeDoughs.map(dough => {
      if (dough.id === id) {
        return {
          ...dough,
          bulkStarted: true,
          bulkDuration: hours,
          bulkReadyAt: addHours(now, hours).toISOString(),
        }
      }
      return dough
    })
    setActiveDoughs(updated)
    localStorage.setItem('activeDoughs', JSON.stringify(updated))
  }

  const startBallFermentTimer = (id: string, hours: number) => {
    const now = new Date()
    const updated = activeDoughs.map(dough => {
      if (dough.id === id) {
        return {
          ...dough,
          ballFermentStarted: true,
          ballFermentDuration: hours,
          ballFermentReadyAt: addHours(now, hours).toISOString(),
        }
      }
      return dough
    })
    setActiveDoughs(updated)
    localStorage.setItem('activeDoughs', JSON.stringify(updated))
  }

  const togglePreviewFinal = (id: string) => {
    const updated = activeDoughs.map(dough => {
      if (dough.id === id) {
        return { ...dough, isPreviewingFinal: !dough.isPreviewingFinal }
      }
      return dough
    })
    setActiveDoughs(updated)
  }

  const deleteDough = (id: string) => {
    const updated = activeDoughs.filter(dough => dough.id !== id)
    setActiveDoughs(updated)
    localStorage.setItem('activeDoughs', JSON.stringify(updated))
  }

  const getFormattedCountdown = (targetISO?: string, defaultHours: number = 13) => {
    if (!targetISO) {
      targetISO = addHours(new Date(), defaultHours).toISOString()
    }
    const now = new Date()
    const target = new Date(targetISO)
    const diffSecs = differenceInSeconds(target, now)

    if (diffSecs <= 0) return 'Ready!'

    const hrs = Math.floor(diffSecs / 3600)
    const mins = Math.floor((diffSecs % 3600) / 60)
    const secs = diffSecs % 60

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Active Doughs</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Manage and track your doughs currently in progress.
        </p>
      </div>

      {activeDoughs.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No active doughs found. Head over to the calculator to start one!</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {activeDoughs.map(dough => {
            const currentStage = dough.stage || 'preferment'
            const res = dough.results

            const prefFlour = res.prefermentFlour || 0
            const prefWater = res.prefermentWater || 0
            const prefFlourPct =
              res.prefermentPercentage ||
              (res.totalFlour ? Math.round((prefFlour / res.totalFlour) * 100) : 0)
            const prefHydration =
              res.prefermentHydration || (prefFlour ? Math.round((prefWater / prefFlour) * 100) : 0)

            const yeastAmount =
              res.prefermentYeast !== undefined
                ? res.prefermentYeast
                : res.yeast !== undefined
                  ? res.yeast
                  : 0

            const finalFlour =
              res.finalFlour !== undefined ? res.finalFlour : res.totalFlour - prefFlour
            const finalWater =
              res.finalWater !== undefined ? res.finalWater : res.totalWater - prefWater

            const currentIndex = stages.indexOf(currentStage)

            return (
              <Card key={dough.id} className="relative flex flex-col shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {dough.preset} Style ({dough.preferment.toUpperCase()})
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-8 p-0"
                      onClick={() => deleteDough(dough.id)}
                      title="Delete Dough"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Added on: {format(new Date(dough.startedAt), 'MMM d, yyyy @ HH:mm')}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Dough Balls Info */}
                    <div className="flex items-center justify-between bg-primary/5 px-3 py-2 rounded-md text-sm font-medium border border-primary/10">
                      <span className="flex items-center gap-1.5 text-primary">
                        <Layers className="size-4" /> Dough Portioning:
                      </span>
                      <span>
                        {res.doughBallCount} balls × {res.doughBallWeight} g
                      </span>
                    </div>

                    {/* Step Tracker */}
                    <div className="flex items-center justify-between text-[12px] font-medium">
                      <span
                        className={
                          currentStage === 'preferment'
                            ? 'text-primary font-bold'
                            : dough.prefermentCompleted
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                        }
                      >
                        1. Preferment {dough.prefermentCompleted && '✓'}
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'final_dough'
                            ? 'text-primary font-bold'
                            : dough.finalDoughCompleted
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                        }
                      >
                        2. Dough Mixing {dough.finalDoughCompleted && '✓'}
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'bulk'
                            ? 'text-primary font-bold'
                            : dough.bulkCompleted
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                        }
                      >
                        3. Bulk Fermentation {dough.bulkCompleted && '✓'}
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'ball_ferment'
                            ? 'text-primary font-bold'
                            : dough.ballFermentCompleted
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                        }
                      >
                        4. Balled Fermentation {dough.ballFermentCompleted && '✓'}
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'room_rest'
                            ? 'text-primary font-bold'
                            : dough.roomRestCompleted
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                        }
                      >
                        5. Room Temperature Rest {dough.roomRestCompleted && '✓'}
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'completed'
                            ? 'text-green-600 font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        6. Bake
                      </span>
                    </div>

                    {/* Dynamic Content Area */}
                    <div>
                      {/* Step 1 Content */}
                      {currentStage === 'preferment' &&
                        dough.preferment !== 'none' &&
                        !dough.isPreviewingFinal && (
                          <div className="text-xs space-y-2 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <Calculator className="size-3.5 text-primary" /> Step 1: Preferment
                              Mix ({dough.preferment.toUpperCase()}):
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                              <p>
                                Flour:{' '}
                                <span className="font-medium text-foreground">{prefFlour} g</span>{' '}
                                <span className="text-[10px]">
                                  ({prefFlourPct}% of total flour)
                                </span>
                              </p>
                              <p>
                                Water:{' '}
                                <span className="font-medium text-foreground">{prefWater} g</span>{' '}
                                <span className="text-[10px]">({prefHydration}% hydration)</span>
                              </p>
                              {yeastAmount > 0 && (
                                <p className="col-span-2">
                                  Yeast:{' '}
                                  <span className="font-medium text-foreground">
                                    {Number(yeastAmount).toFixed(2)} g
                                  </span>
                                </p>
                              )}
                            </div>
                            {!dough.prefermentStarted && !dough.prefermentCompleted && (
                              <div className="pt-2 border-t border-border/60">
                                <p className="text-[12px] font-medium text-foreground mb-1.5">
                                  Select duration ({dough.preferment.toUpperCase()} at{' '}
                                  {dough.roomTemp || 21}°C):
                                </p>
                                <div className="flex gap-2">
                                  {getPrefermentTimeOptions(
                                    dough.preferment,
                                    dough.roomTemp || 21
                                  ).map(option => (
                                    <Button
                                      key={option.hours}
                                      variant={
                                        dough.prefermentDuration === option.hours
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size="sm"
                                      className="flex-1 h-7 text-[10px] px-1"
                                      onClick={() => startPrefermentTimer(dough.id, option.hours)}
                                    >
                                      {option.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Preview Step 2 Ingredients */}
                      {currentStage === 'preferment' && dough.isPreviewingFinal && (
                        <div className="text-xs space-y-1.5 bg-primary/5 p-3 rounded-md border border-primary/20 animate-in fade-in-50">
                          <div className="flex items-center justify-between pb-1 border-b border-primary/10">
                            <p className="font-semibold text-primary flex items-center gap-1">
                              <Eye className="size-3.5" /> Preview: Step 2 Final Mix (Read-Only)
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => togglePreviewFinal(dough.id)}
                            >
                              Back to Step 1
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                            <div className="col-span-2 space-y-1 bg-background/50 p-2 rounded border">
                              <p className="text-[12px] font-semibold text-foreground">
                                Remaining Flour Breakdown:
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                                {res.remaining00Flour > 0 && (
                                  <p>
                                    Type 00:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remaining00Flour} g
                                    </span>
                                  </p>
                                )}
                                {res.remainingBreadFlour > 0 && (
                                  <p>
                                    Bread Flour:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remainingBreadFlour} g
                                    </span>
                                  </p>
                                )}
                                {res.remainingWholeFlour > 0 && (
                                  <p>
                                    Whole Flour:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remainingWholeFlour} g
                                    </span>
                                  </p>
                                )}
                                {res.remainingWholeGrain > 0 && (
                                  <p>
                                    Whole Grain:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remainingWholeGrain} g
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <p>
                              Remaining Water:{' '}
                              <span className="font-medium text-foreground">{finalWater} g</span>
                            </p>
                            {res.salt !== undefined && res.salt > 0 && (
                              <p>
                                Salt:{' '}
                                <span className="font-medium text-foreground">{res.salt} g</span>
                              </p>
                            )}
                            {res.oil !== undefined && res.oil > 0 && (
                              <p>
                                Oil:{' '}
                                <span className="font-medium text-foreground">{res.oil} g</span>
                              </p>
                            )}
                            {res.dmp !== undefined && res.dmp > 0 && (
                              <p>
                                DMP:{' '}
                                <span className="font-medium text-foreground">{res.dmp} g</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 2 Content */}
                      {currentStage === 'final_dough' && (
                        <div className="text-xs space-y-1.5 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <Calculator className="size-3.5 text-primary" /> Step 2: Remaining
                            Ingredients
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                            <div className="col-span-2 space-y-1 bg-background/50 p-2 rounded border">
                              <p className="text-[12px] font-semibold text-foreground">
                                Remaining Flour Breakdown:
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                                {res.remaining00Flour > 0 && (
                                  <p>
                                    Type 00:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remaining00Flour} g
                                    </span>
                                  </p>
                                )}
                                {res.remainingBreadFlour > 0 && (
                                  <p>
                                    Bread Flour:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remainingBreadFlour} g
                                    </span>
                                  </p>
                                )}
                                {res.remainingWholeFlour > 0 && (
                                  <p>
                                    Whole Flour:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remainingWholeFlour} g
                                    </span>
                                  </p>
                                )}
                                {res.remainingWholeGrain > 0 && (
                                  <p>
                                    Whole Grain:{' '}
                                    <span className="font-medium text-foreground">
                                      {res.remainingWholeGrain} g
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <p>
                              Remaining Water:{' '}
                              <span className="font-medium text-foreground">{finalWater} g</span>
                            </p>
                            {res.salt !== undefined && res.salt > 0 && (
                              <p>
                                Salt:{' '}
                                <span className="font-medium text-foreground">{res.salt} g</span>
                              </p>
                            )}
                            {dough.preferment === 'none' &&
                              res.yeast !== undefined &&
                              res.yeast > 0 && (
                                <p>
                                  Yeast:{' '}
                                  <span className="font-medium text-foreground">
                                    {Number(res.yeast).toFixed(2)} g
                                  </span>
                                </p>
                              )}
                            {res.oil !== undefined && res.oil > 0 && (
                              <p>
                                Oil:{' '}
                                <span className="font-medium text-foreground">{res.oil} g</span>
                              </p>
                            )}
                            {res.dmp !== undefined && res.dmp > 0 && (
                              <p>
                                DMP:{' '}
                                <span className="font-medium text-foreground">{res.dmp} g</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 3 Content */}
                      {currentStage === 'bulk' && (
                        <div className="text-xs space-y-3 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <Clock className="size-3.5 text-primary" /> Step 3: Bulk Ferment
                            </p>
                            <Badge variant="secondary" className="text-[12px]">
                              Bulk Cold Fermentation
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Bulk fermenting your dough. Monitor gas production and gluten structure
                            development.
                          </p>
                          {!dough.bulkStarted && !dough.bulkCompleted && (
                            <div className="pt-2 border-t border-border/60">
                              <p className="text-[12px] font-medium text-foreground mb-1.5">
                                Select bulk fermentation duration to start timer:
                              </p>
                              <div className="flex gap-2">
                                {[24, 48, 72].map(hrs => (
                                  <Button
                                    key={hrs}
                                    variant={dough.bulkDuration === hrs ? 'default' : 'outline'}
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => startBulkTimer(dough.id, hrs)}
                                  >
                                    {hrs}h {hrs === 48 ? '(Rec.)' : ''}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 4 Content */}
                      {currentStage === 'ball_ferment' && (
                        <div className="text-xs space-y-3 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <Layers className="size-3.5 text-primary" /> Step 4: Dough Balling
                            </p>
                            <Badge variant="secondary" className="text-[10px]">
                              Cold Balled Fermentation
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Divide your dough into {res.doughBallCount} individual portions of{' '}
                            {res.doughBallWeight}g each, round them into tight balls, and store
                            them.
                          </p>
                          {!dough.ballFermentStarted && !dough.ballFermentCompleted && (
                            <div className="pt-2 border-t border-border/60">
                              <p className="text-[12px] font-medium text-foreground mb-1.5">
                                Select ball fermentation duration to start timer:
                              </p>
                              <div className="flex gap-2">
                                {[16, 20, 24].map(hrs => (
                                  <Button
                                    key={hrs}
                                    variant={
                                      dough.ballFermentDuration === hrs ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => startBallFermentTimer(dough.id, hrs)}
                                  >
                                    {hrs}h {hrs === 24 ? '(Rec.)' : ''}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 5 Content */}
                      {currentStage === 'room_rest' && (
                        <div className="text-xs space-y-2 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <SunMedium className="size-3.5 text-amber-500" /> Step 5: Room Temp
                              Rest (3 hrs):
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] text-amber-600 border-amber-300"
                            >
                              3 Hours Prior
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Take your dough balls out of the fridge for a 3-hour room temperature
                            rest to relax the gluten structure.
                          </p>
                        </div>
                      )}

                      {/* Step 6 Content */}
                      {currentStage === 'completed' && (
                        <div className="text-xs space-y-1.5 bg-green-500/10 p-3 rounded-md border border-green-500/20 text-green-700 dark:text-green-300 animate-in fade-in-50">
                          <p className="font-semibold flex items-center gap-1">
                            <CheckCircle2 className="size-3.5 text-green-600" /> Step 6: Ready to
                            Bake!
                          </p>
                          <p className="text-muted-foreground">
                            Your dough has completed all preparation and resting stages. Stretch
                            gently, add your toppings, and bake!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action & Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/40">
                    <div className="flex items-center gap-2">
                      {currentStage !== 'preferment' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (currentIndex > 0) {
                              updateStage(dough.id, stages[currentIndex - 1])
                            }
                          }}
                        >
                          <ArrowLeft className="mr-1 size-3" /> Back
                        </Button>
                      )}

                      {/* Step 1 Actions */}
                      {currentStage === 'preferment' && (
                        <>
                          {!dough.prefermentCompleted ? (
                            <Button
                              size="sm"
                              disabled={!dough.prefermentStarted}
                              onClick={() => {
                                if (dough.prefermentStarted) {
                                  setConfirmModalDoughId(dough.id)
                                }
                              }}
                            >
                              Finish Preferment <Play className="ml-2 size-3" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'final_dough')}>
                              Go to Step 2 <ArrowRight className="ml-1.5 size-3" />
                            </Button>
                          )}

                          {!dough.prefermentCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePreviewFinal(dough.id)}
                            >
                              <Eye className="mr-1.5 size-3" />
                              {dough.isPreviewingFinal ? 'Hide Preview' : 'Preview Step 2'}
                            </Button>
                          )}
                        </>
                      )}

                      {/* Step 2 Actions */}
                      {currentStage === 'final_dough' && (
                        <>
                          {!dough.finalDoughCompleted ? (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'bulk')}>
                              Start Bulk Ferment <Play className="ml-2 size-3" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'bulk')}>
                              Go to Step 3 <ArrowRight className="ml-1.5 size-3" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Step 3 Actions */}
                      {currentStage === 'bulk' && (
                        <>
                          {!dough.bulkCompleted ? (
                            <Button
                              size="sm"
                              disabled={!dough.bulkStarted}
                              onClick={() => {
                                if (dough.bulkStarted) {
                                  setBulkConfirmModalDoughId(dough.id)
                                }
                              }}
                            >
                              Finish Bulk Fermentation <Play className="ml-2 size-3" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'ball_ferment')}>
                              Go to Step 4 <ArrowRight className="ml-1.5 size-3" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Step 4 Actions */}
                      {currentStage === 'ball_ferment' && (
                        <>
                          {!dough.ballFermentCompleted ? (
                            <Button
                              size="sm"
                              disabled={!dough.ballFermentStarted}
                              onClick={() => {
                                if (dough.ballFermentStarted) {
                                  setBallConfirmModalDoughId(dough.id)
                                }
                              }}
                            >
                              Finish Ball Fermentation <Play className="ml-2 size-3" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'room_rest')}>
                              Go to Step 5 <ArrowRight className="ml-1.5 size-3" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Step 5 Actions */}
                      {currentStage === 'room_rest' && (
                        <>
                          {!dough.roomRestCompleted ? (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'completed')}>
                              Mark Ready to Bake <CheckCircle2 className="ml-2 size-3" />
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => updateStage(dough.id, 'completed')}>
                              Go to Step 6 <ArrowRight className="ml-1.5 size-3" />
                            </Button>
                          )}
                        </>
                      )}

                      {currentStage === 'completed' && (
                        <Badge className="bg-green-600 text-white">Ready for Oven</Badge>
                      )}
                    </div>

                    {/* Persistent Completion Badges or Active Timers per Step */}
                    {currentStage === 'preferment' && dough.prefermentCompleted ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50/50 text-[12px] gap-1"
                      >
                        <CheckCircle2 className="size-3" /> {dough.prefermentDuration || 13}h
                        Fermentation Complete
                      </Badge>
                    ) : currentStage === 'preferment' && dough.prefermentStarted ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-primary animate-pulse" />
                        <span>
                          {getFormattedCountdown(
                            dough.prefermentReadyAt,
                            dough.prefermentDuration || 13
                          )}
                        </span>
                      </div>
                    ) : null}

                    {currentStage === 'final_dough' && dough.finalDoughCompleted ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50/50 text-[12px] gap-1"
                      >
                        <CheckCircle2 className="size-3" /> Final Mix Complete
                      </Badge>
                    ) : null}

                    {currentStage === 'bulk' && dough.bulkCompleted ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50/50 text-[12px] gap-1"
                      >
                        <CheckCircle2 className="size-3" /> {dough.bulkDuration || 48}h Bulk
                        Fermentation Complete
                      </Badge>
                    ) : currentStage === 'bulk' && dough.bulkStarted ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-primary animate-pulse" />
                        <span>
                          {getFormattedCountdown(dough.bulkReadyAt, dough.bulkDuration || 48)}
                        </span>
                      </div>
                    ) : null}

                    {currentStage === 'ball_ferment' && dough.ballFermentCompleted ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50/50 text-[12px] gap-1"
                      >
                        <CheckCircle2 className="size-3" /> {dough.ballFermentDuration || 24}h Ball
                        Fermentation Complete
                      </Badge>
                    ) : currentStage === 'ball_ferment' && dough.ballFermentStarted ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-primary animate-pulse" />
                        <span>
                          {getFormattedCountdown(
                            dough.ballFermentReadyAt,
                            dough.ballFermentDuration || 24
                          )}
                        </span>
                      </div>
                    ) : null}

                    {currentStage === 'room_rest' && dough.roomRestCompleted ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50/50 text-[12px] gap-1"
                      >
                        <CheckCircle2 className="size-3" /> 3h Room Rest Complete
                      </Badge>
                    ) : currentStage === 'room_rest' ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-amber-500 animate-pulse" />
                        <span>{getFormattedCountdown(dough.roomRestReadyAt, 3)}</span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal for Preferment Completion */}
      <AlertDialog
        open={Boolean(confirmModalDoughId)}
        onOpenChange={open => !open && setConfirmModalDoughId(null)}
      >
        <AlertDialogContent size="sm" className="text-center p-0 overflow-hidden">
          <div className="p-6 space-y-2">
            <AlertDialogTitle className="text font-semibold normal-case tracking-normal">
              Confirm preferment stage
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground normal-case leading-relaxed">
              Are you sure the preferment is fully matured and ready? Moving forward will transition
              to Step 2 (Final Mix).
            </AlertDialogDescription>
          </div>
          <div className="flex border-t border-border p-3 gap-2 bg-muted/30">
            <AlertDialogCancel
              className="flex-1 mt-0 normal-case bg-white"
              onClick={() => setConfirmModalDoughId(null)}
            >
              No, stay here
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 mt-0 normal-case"
              onClick={() => {
                if (confirmModalDoughId) {
                  updateStage(confirmModalDoughId, 'final_dough')
                  setConfirmModalDoughId(null)
                }
              }}
            >
              Yes, move forward
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal for Bulk Fermentation Completion */}
      <AlertDialog
        open={Boolean(bulkConfirmModalDoughId)}
        onOpenChange={open => !open && setBulkConfirmModalDoughId(null)}
      >
        <AlertDialogContent size="sm" className="text-center p-0 overflow-hidden">
          <div className="p-6 space-y-2">
            <AlertDialogTitle className="text-lg font-semibold normal-case tracking-normal">
              Confirm bulk fermentation
            </AlertDialogTitle>
            <AlertDialogDescription className="text text-muted-foreground normal-case leading-relaxed">
              Are you sure bulk fermentation is complete? Moving forward will transition to Step 4
              (Balled Ferment).
            </AlertDialogDescription>
          </div>
          <div className="flex border-t border-border p-3 gap-2 bg-muted/30">
            <AlertDialogCancel
              className="flex-1 mt-0 normal-case bg-white"
              onClick={() => setBulkConfirmModalDoughId(null)}
            >
              No, stay here
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 mt-0 normal-case"
              onClick={() => {
                if (bulkConfirmModalDoughId) {
                  updateStage(bulkConfirmModalDoughId, 'ball_ferment')
                  setBulkConfirmModalDoughId(null)
                }
              }}
            >
              Yes, move forward
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Modal for Ball Fermentation Completion */}
      <AlertDialog
        open={Boolean(ballConfirmModalDoughId)}
        onOpenChange={open => !open && setBallConfirmModalDoughId(null)}
      >
        <AlertDialogContent size="sm" className="text-center p-0 overflow-hidden">
          <div className="p-6 space-y-2">
            <AlertDialogTitle className="text-lg font-semibold normal-case tracking-normal">
              Confirm ball fermentation
            </AlertDialogTitle>
            <AlertDialogDescription className="text text-muted-foreground normal-case leading-relaxed">
              Are you sure ball fermentation is complete? Moving forward will transition to Step 5
              (Room Rest).
            </AlertDialogDescription>
          </div>
          <div className="flex border-t border-border p-3 gap-2 bg-muted/30">
            <AlertDialogCancel
              className="flex-1 mt-0 normal-case bg-white"
              onClick={() => setBallConfirmModalDoughId(null)}
            >
              No, stay here
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 mt-0 normal-case"
              onClick={() => {
                if (ballConfirmModalDoughId) {
                  updateStage(ballConfirmModalDoughId, 'room_rest')
                  setBallConfirmModalDoughId(null)
                }
              }}
            >
              Yes, move forward
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
