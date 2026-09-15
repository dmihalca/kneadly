'use client'

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
  Clock,
  TrendingUp,
  SunMedium,
  AlertCircle,
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
}

export default function ActiveDoughsPage() {
  const [activeDoughs, setActiveDoughs] = useState<ActiveDough[]>([])
  const [confirmModalDoughId, setConfirmModalDoughId] = useState<string | null>(null)
  const [, setTick] = useState(0)

  // Force tick every second to keep live countdowns updating
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('activeDoughs') || '[]')
    const initialized = saved.map((dough: ActiveDough) => {
      const startDate = new Date(dough.startedAt)
      if (!dough.prefermentReadyAt) {
        dough.prefermentReadyAt = addHours(startDate, 13).toISOString()
      }
      return dough
    })
    setActiveDoughs(initialized)
  }, [])

  const updateStage = (id: string, nextStage: DoughStage) => {
    const now = new Date()
    const updated = activeDoughs.map(dough => {
      if (dough.id === id) {
        const updatedDough = { ...dough, stage: nextStage }
        if (nextStage === 'bulk' && !updatedDough.bulkReadyAt) {
          updatedDough.bulkReadyAt = addHours(now, 48).toISOString()
        } else if (nextStage === 'ball_ferment' && !updatedDough.ballFermentReadyAt) {
          updatedDough.ballFermentReadyAt = addHours(now, 24).toISOString()
        } else if (nextStage === 'room_rest' && !updatedDough.roomRestReadyAt) {
          updatedDough.roomRestReadyAt = addHours(now, 3).toISOString()
        }
        return updatedDough
      }
      return dough
    })
    setActiveDoughs(updated)
    localStorage.setItem('activeDoughs', JSON.stringify(updated))
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
        <p className="text-sm text-muted-foreground">
          Manage and track your doughs currently in progress.
        </p>
      </div>

      {activeDoughs.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No active doughs found. Head over to the calculator to start one!</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
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

            // Look for yeast in different possible keys stored from the calculator
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
                    Started on: {format(new Date(dough.startedAt), 'MMM d, yyyy @ HH:mm')}
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
                    <div className="flex items-center justify-between text-[10px] font-medium border-b pb-3">
                      <span
                        className={
                          currentStage === 'preferment'
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        1. Preferment
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'final_dough'
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        2. Final
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'bulk'
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        3. Bulk
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'ball_ferment'
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        4. Balled
                      </span>
                      <span>→</span>
                      <span
                        className={
                          currentStage === 'room_rest'
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground'
                        }
                      >
                        5. Rest
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
                      {/* Step 1: Preferment Breakdown with robust yeast detection */}
                      {currentStage === 'preferment' && dough.preferment !== 'none' && (
                        <div className="text-xs space-y-1.5 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <Calculator className="size-3.5 text-primary" /> Step 1: Preferment Mix
                            ({dough.preferment.toUpperCase()}):
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                            <p>
                              Flour:{' '}
                              <span className="font-medium text-foreground">{prefFlour} g</span>{' '}
                              <span className="text-[10px]">({prefFlourPct}% of total flour)</span>
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
                        </div>
                      )}
                      {currentStage === 'final_dough' && (
                        <div className="text-xs space-y-1.5 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <Calculator className="size-3.5 text-primary" /> Step 2: Final Mix
                            Ingredients:
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                            <p>
                              Remaining Flour:{' '}
                              <span className="font-medium text-foreground">{finalFlour} g</span>
                            </p>
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
                            {/* ONLY show yeast here if there is NO preferment (direct dough) */}
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

                      {currentStage === 'bulk' && (
                        <div className="text-xs space-y-3 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <Clock className="size-3.5 text-primary" /> Step 3: Bulk Ferment (48
                              hrs):
                            </p>
                            <Badge variant="secondary" className="text-[10px]">
                              Active Fermentation
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Bulk fermenting your dough for 48 hours. Monitor gas production and
                            gluten structure development.
                          </p>
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="size-3 text-primary" /> Fermentation Activity
                                Curve
                              </span>
                              <span>Peak Bulk</span>
                            </div>
                            <div className="h-10 w-full bg-background rounded border flex items-end px-1 gap-0.5">
                              {[6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15].map(
                                (height, i) => (
                                  <div
                                    key={i}
                                    style={{ height: `${height}%` }}
                                    className="
        flex-1 
        rounded-t 
        bg-gradient-to-t from-primary/30 to-primary/60 
        animate-[pulse_4s_ease-in-out_infinite] 
        transition-all
      "
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStage === 'ball_ferment' && (
                        <div className="text-xs space-y-2 bg-muted/40 p-3 rounded-md border animate-in fade-in-50">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <Layers className="size-3.5 text-primary" /> Step 4: 24h Balled
                              Ferment:
                            </p>
                            <Badge variant="secondary" className="text-[10px]">
                              24 Hours
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Divide your dough into {res.doughBallCount} individual portions of{' '}
                            {res.doughBallWeight}g each, round them into tight balls, and store them
                            in fermentation boxes for 24 hours.
                          </p>
                        </div>
                      )}

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
                            const currentIndex = stages.indexOf(currentStage)
                            if (currentIndex > 0) {
                              updateStage(dough.id, stages[currentIndex - 1])
                            }
                          }}
                        >
                          <ArrowLeft className="mr-1 size-3" /> Back
                        </Button>
                      )}

                      {currentStage === 'preferment' && (
                        <Button size="sm" onClick={() => setConfirmModalDoughId(dough.id)}>
                          Finish Preferment <Play className="ml-2 size-3" />
                        </Button>
                      )}
                      {currentStage === 'final_dough' && (
                        <Button size="sm" onClick={() => updateStage(dough.id, 'bulk')}>
                          Start Bulk Ferment <Play className="ml-2 size-3" />
                        </Button>
                      )}
                      {currentStage === 'bulk' && (
                        <Button size="sm" onClick={() => updateStage(dough.id, 'ball_ferment')}>
                          Start Balled Ferment <Play className="ml-2 size-3" />
                        </Button>
                      )}
                      {currentStage === 'ball_ferment' && (
                        <Button size="sm" onClick={() => updateStage(dough.id, 'room_rest')}>
                          Start Room Rest <Play className="ml-2 size-3" />
                        </Button>
                      )}
                      {currentStage === 'room_rest' && (
                        <Button size="sm" onClick={() => updateStage(dough.id, 'completed')}>
                          Mark Ready to Bake <CheckCircle2 className="ml-2 size-3" />
                        </Button>
                      )}
                      {currentStage === 'completed' && (
                        <Badge className="bg-green-600 text-white">Ready for Oven</Badge>
                      )}
                    </div>

                    {/* Stage-specific countdown timers positioned on the right */}
                    {currentStage === 'preferment' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-primary animate-pulse" />
                        <span>{getFormattedCountdown(dough.prefermentReadyAt, 13)}</span>
                      </div>
                    )}
                    {currentStage === 'bulk' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-primary animate-pulse" />
                        <span>{getFormattedCountdown(dough.bulkReadyAt, 48)}</span>
                      </div>
                    )}
                    {currentStage === 'ball_ferment' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-primary animate-pulse" />
                        <span>{getFormattedCountdown(dough.ballFermentReadyAt, 24)}</span>
                      </div>
                    )}
                    {currentStage === 'room_rest' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted rounded-md text-xs font-mono border">
                        <Clock className="size-3.5 text-amber-500 animate-pulse" />
                        <span>{getFormattedCountdown(dough.roomRestReadyAt, 3)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation Modal for Preferment Completion */}
      {confirmModalDoughId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle className="size-6" />
              <h3 className="text-lg font-semibold text-foreground">Confirm Preferment Stage</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure the preferment is fully matured and ready? Moving forward will transition
              to Step 2 (Final Mix).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmModalDoughId(null)}>
                No, Stay Here
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updateStage(confirmModalDoughId, 'final_dough')
                  setConfirmModalDoughId(null)
                }}
              >
                Yes, Move Forward
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
