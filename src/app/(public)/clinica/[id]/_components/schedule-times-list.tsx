"use client";

import { Button } from "@/components/ui/button";
import { TimeSlot } from "./schedule-content";
import { cn } from "@/lib/utils";
import {
  isToday,
  isSlotInThePast,
  isSlotSequenceAvailable,
} from "./schedule-utils";

interface ScheduleTimeListProps {
  selectedDate: Date;
  selectedTime: string;
  requiredSlots: number;
  blockedTimes: string[];
  availableTimeSlots: TimeSlot[];
  clinicTimes: string[];
  onSelectTime: (time: string) => void;
}

export function ScheduleTimesLista({
  selectedDate,
  selectedTime,
  requiredSlots,
  blockedTimes,
  availableTimeSlots,
  clinicTimes,
  onSelectTime,
}: ScheduleTimeListProps) {
  const dateIsToday = isToday(selectedDate);

  // Debug logs
  console.log("=== DEBUG SCHEDULE TIMES ===");
  console.log("blockedTimes:", blockedTimes);
  console.log("availableTimeSlots:", availableTimeSlots);
  console.log("requiredSlots:", requiredSlots);

  return (
    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
      {availableTimeSlots.map((slot) => {
        const sequenceOk = isSlotSequenceAvailable(
          slot.time,
          requiredSlots,
          clinicTimes,
          blockedTimes
        );

        const slotIsPast = dateIsToday && isSlotInThePast(slot.time);
        const isSlotDisabled = !slot.available || !sequenceOk || slotIsPast;

        // Debug para cada slot
        console.log(`Slot ${slot.time}:`, {
          available: slot.available,
          sequenceOk,
          slotIsPast,
          isSlotDisabled,
          blockedTimes: blockedTimes.includes(slot.time),
        });

        return (
          <Button
            onClick={() => {
              console.log(`Tentando selecionar: ${slot.time}`);
              if (!isSlotDisabled) {
                onSelectTime(slot.time);
              }
            }}
            type="button"
            variant="outline"
            key={slot.time}
            className={cn(
              "h-10 select-none",
              selectedTime === slot.time &&
                "border-2 bg-emerald-200 text-primary border-emerald-500",
              isSlotDisabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={isSlotDisabled}
          >
            {slot.time}
          </Button>
        );
      })}
    </div>
  );
}
