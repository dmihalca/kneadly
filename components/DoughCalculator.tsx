"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

/* ---------- Types ---------- */

type DoughResults = {
  earliest: Date | null;
  latest: Date | null;
  totalFlour: number;
  bigaFlour: number;
  bigaWater: number;
  bigaYeast: number;
  finalFlour: number;
  finalWater: number;
  salt: number;
  dmp: number;
  oil: number;
  finalYeast: number;
  totalDoughWeight: number;
  flour00Grams: number;
  breadFlourGrams: number;
  wholeFlourGrams: number;
  wholeGrainGrams: number;
};

/* ---------- Presets ---------- */

const presets = {
  neapolitan: {
    hydration: 62.5,
    salt: 2.8,
    yeast: 0.1,
    oil: 1.5,
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
};

/* ---------- Auto yeast for BIGA ONLY ---------- */

function autoYeastForBiga(hours: number, tempC: number): number {
  const base = 0.10; // 0.10% at 14h, 22°C
  const timeFactor = 14 / hours;
  const tempFactor = tempC / 22;

  const percent = base * timeFactor * tempFactor;

  return Number(Math.min(Math.max(percent, 0.08), 0.12).toFixed(3));
}

/* ---------- Component ---------- */

export default function DoughCalculator() {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>("10:30:00");

  const [balls, setBalls] = useState<number>(4);

  const [hydration, setHydration] = useState<number>(62.5);
  const [saltPercent, setSaltPercent] = useState<number>(3);
  const [oilPercent, setOilPercent] = useState<number>(2);

  const [fermentationHours, setFermentationHours] = useState<number>(14);
  const [roomTemp, setRoomTemp] = useState<number>(22);

  const [flour00, setFlour00] = useState<number>(90);
  const [breadFlour, setBreadFlour] = useState<number>(5);
  const [wholeFlour, setWholeFlour] = useState<number>(5);
  const [wholeGrain, setWholeGrain] = useState<number>(0);

  const [results, setResults] = useState<DoughResults | null>(null);

  const DOUGH_BALL_WEIGHT = 275;
  const BIGA_FLOUR = 300;
  const BIGA_HYDRATION = 0.45;
  const DMP_PERCENT = 0.01;

  /* ---------- Apply preset ---------- */
  const applyPreset = (name: keyof typeof presets) => {
    const p = presets[name];
    setHydration(p.hydration);
    setSaltPercent(p.salt);
    setOilPercent(p.oil);
  };

  /* ---------- Main calculation ---------- */
  const calculateAll = () => {
    const bigaYeastPercent = autoYeastForBiga(fermentationHours, roomTemp);

    let earliest: Date | null = null;
    let latest: Date | null = null;
    let finalDate: Date | null = null;

if (date && time) {
  const parts = time.split(":").map(Number);
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;
  const ss = parts[2] ?? 0;

  finalDate = new Date(date);
  finalDate.setHours(hh);
  finalDate.setMinutes(mm);
  finalDate.setSeconds(ss);

  earliest = new Date(finalDate.getTime() - 14 * 60 * 60 * 1000);
  latest = new Date(finalDate.getTime() - 12 * 60 * 60 * 1000);
}


    const totalDoughWeight = balls * DOUGH_BALL_WEIGHT;
    const totalFlour = 650 * (totalDoughWeight / 1080);

    const blendTotal =
      flour00 + breadFlour + wholeFlour + wholeGrain || 1;

    const flour00Grams = totalFlour * (flour00 / blendTotal);
    const breadFlourGrams = totalFlour * (breadFlour / blendTotal);
    const wholeFlourGrams = totalFlour * (wholeFlour / blendTotal);
    const wholeGrainGrams = totalFlour * (wholeGrain / blendTotal);

    const bigaFlour = BIGA_FLOUR * (totalFlour / 650);
    const bigaWater = bigaFlour * BIGA_HYDRATION;
    const bigaYeast = bigaFlour * (bigaYeastPercent / 100);

    const finalFlour = totalFlour - bigaFlour;

    const HYDRATION = hydration / 100;
    const totalWater = totalFlour * HYDRATION;
    const finalWater = totalWater - bigaWater;

    const salt = totalFlour * (saltPercent / 100);
    const dmp = totalFlour * DMP_PERCENT;
    const oil = totalFlour * (oilPercent / 100);

    const finalYeast = 0; // BIGA ONLY

    setResults({
      earliest,
      latest,
      totalFlour,
      bigaFlour,
      bigaWater,
      bigaYeast,
      finalFlour,
      finalWater,
      salt,
      dmp,
      oil,
      finalYeast,
      totalDoughWeight,
      flour00Grams,
      breadFlourGrams,
      wholeFlourGrams,
      wholeGrainGrams,
    });
  };

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
              <Button onClick={() => applyPreset("neapolitan")}>Neapolitan</Button>
              <Button onClick={() => applyPreset("newYork")}>New York</Button>
              <Button onClick={() => applyPreset("roman")}>Roman</Button>
              <Button onClick={() => applyPreset("focaccia")}>Focaccia</Button>
            </div>
          </div>

          {/* AUTO YEAST */}
          <div className="space-y-2">
            <Label>Biga Fermentation Time (hours)</Label>
            <Input
              type="number"
              value={fermentationHours}
              onChange={(e) => setFermentationHours(Number(e.target.value))}
            />

            <Label>Room Temperature (°C)</Label>
            <Input
              type="number"
              value={roomTemp}
              onChange={(e) => setRoomTemp(Number(e.target.value))}
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
        <span className="absolute left 0 top-2.5 text-muted-foreground font-medium">%</span>
        <Input
          type="number"
          value={flour00}
          onChange={(e) => setFlour00(Number(e.target.value))}
          className="pl-6"
        />
      </div>
    </div>

    {/* BREAD FLOUR */}
    <div>
      <Label>Bread Flour</Label>
      <div className="relative">
        <span className="absolute left 0 top-2.5 text-muted-foreground font-medium">%</span>
        <Input
          type="number"
          value={breadFlour}
          onChange={(e) => setBreadFlour(Number(e.target.value))}
          className="pl-6"
        />
      </div>
    </div>

    {/* WHOLE WHEAT */}
    <div>
      <Label>Whole Wheat</Label>
      <div className="relative">
        <span className="absolute left0 top-2.5 text-muted-foreground font-medium">%</span>
        <Input
          type="number"
          value={wholeFlour}
          onChange={(e) => setWholeFlour(Number(e.target.value))}
          className="pl-6"
        />
      </div>
    </div>

    {/* WHOLE GRAIN */}
    <div>
      <Label>Whole Grain</Label>
      <div className="relative">
        <span className="absolute left 0 top-2.5 text-muted-foreground font-medium">%</span>
        <Input
          type="number"
          value={wholeGrain}
          onChange={(e) => setWholeGrain(Number(e.target.value))}
          className="pl-6"
        />
      </div>
    </div>

  </div>
</div>




          {/* DATE PICKER */}
          <div className="space-y-2">
            <Label>When will you mix the final dough?</Label>

<Popover>
  <PopoverTrigger>
    <span className="w-full block">
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal pointer-events-none"
      >
        {date ? format(date, "PPP") : "Select date"}
      </Button>
    </span>
  </PopoverTrigger>

  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={date ?? undefined}
      onSelect={setDate}
      required
    />
  </PopoverContent>
</Popover>

            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* DOUGH BALLS */}
          <div className="space-y-2">
            <Label>How many dough balls?</Label>
            <Input
              type="number"
              value={balls}
              onChange={(e) => setBalls(Number(e.target.value))}
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
              onChange={(e) => setHydration(Number(e.target.value))}
            />
          </div>

          <Button onClick={calculateAll}>Calculate Everything</Button>

          {results && (
            <>
              <Separator className="my-4" />

              {/* BIGA TIME */}
              {results.earliest && results.latest && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Biga Start Time</h3>
                  <p>Earliest: <strong>{results.earliest.toLocaleString()}</strong></p>
                  <p>Latest: <strong>{results.latest.toLocaleString()}</strong></p>
                </div>
              )}

              <Separator />

               {/* BIGA */}
              <div className="space-y-4">
               <h3 className="text-lg font-semibold">Biga ({fermentationHours}h @ {roomTemp}°C)</h3>
                <p>Biga flour: {results.bigaFlour.toFixed(1)} g</p>
                <p>Biga water: {results.bigaWater.toFixed(1)} g</p>
                <p>Biga yeast: {results.bigaYeast.toFixed(3)} g</p>
              </div>

              <Separator />

               {/* FLOUR BREAKDOWN */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Flour Breakdown</h3>
                <p>00 Flour: {results.flour00Grams.toFixed(1)} g</p>
                <p>Bread Flour: {results.breadFlourGrams.toFixed(1)} g</p>
                <p>Whole Wheat: {results.wholeFlourGrams.toFixed(1)} g</p>
                <p>Whole Grain: {results.wholeGrainGrams.toFixed(1)} g</p>
              </div>

              <Separator />

             {/* TOTALS */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Totals</h3>
                <p>Total dough weight: {results.totalDoughWeight.toFixed(1)} g</p>
                <p>Total flour: {results.totalFlour.toFixed(1)} g</p>
                <p>Total water: {(results.bigaWater + results.finalWater).toFixed(1)} g</p>
              </div>

              <Separator />


              {/* FINAL DOUGH */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Final Dough</h3>
                <p>Final flour: {results.finalFlour.toFixed(1)} g</p>
                <p>Final water: {results.finalWater.toFixed(1)} g</p>
                <p>Salt: {results.salt.toFixed(1)} g</p>
                <p>Diastatic Malt Powder: {results.dmp.toFixed(1)} g</p>
                <p>Olive oil: {results.oil.toFixed(1)} g</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
