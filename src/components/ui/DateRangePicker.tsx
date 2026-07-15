"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function fmt(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function isSame(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(d: Date, start: Date, end: Date): boolean {
  return d.getTime() > start.getTime() && d.getTime() < end.getTime();
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  minDate?: string;
  maxDate?: string;
  onApply: (start: string, end: string) => void;
  onClear: () => void;
  isActive: boolean;
}

export function DateRangePicker({ minDate, maxDate, onApply, onClear, isActive }: Props) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = maxDate ? new Date(maxDate) : new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const handleDayClick = useCallback((day: Date) => {
    if (selecting === "start") {
      setStartDate(day);
      setEndDate(null);
      setSelecting("end");
    } else {
      if (startDate && day.getTime() < startDate.getTime()) {
        setStartDate(day);
        setEndDate(startDate);
      } else {
        setEndDate(day);
      }
      setSelecting("start");
    }
  }, [selecting, startDate]);

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(toDateStr(startDate), toDateStr(endDate));
      setOpen(false);
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setSelecting("start");
    onClear();
    setOpen(false);
  };

  // Build calendar grid
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const isDisabled = (d: Date) => {
    if (min && d.getTime() < new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime()) return true;
    if (max && d.getTime() > new Date(max.getFullYear(), max.getMonth(), max.getDate()).getTime()) return true;
    return false;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-[6px] border text-[12px] font-medium transition-colors ${
          isActive
            ? "bg-[#0E9F8E] text-white border-[#0E9F8E]"
            : "bg-white text-[#6B8299] border-[#E2E8EE] hover:text-[#3D5166]"
        }`}
      >
        <Calendar className="w-3 h-3" strokeWidth={2} />
        {isActive && startDate && endDate ? `${fmt(startDate)} – ${fmt(endDate)}` : "Custom"}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl border border-[#E2E8EE] shadow-xl p-4 w-[300px]"
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-[#F1F5F9] text-[#6B8299]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-semibold text-[#0E2A47]">
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-[#F1F5F9] text-[#6B8299]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Selection hint */}
          <p className="text-[10px] text-[#6B8299] mb-2 text-center">
            {selecting === "start" ? "Select start date" : "Select end date"}
          </p>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#94A3B8] py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;

              const disabled = isDisabled(day);
              const isStart = startDate && isSame(day, startDate);
              const isEnd = endDate && isSame(day, endDate);
              const inRange = startDate && endDate && isBetween(day, startDate, endDate);

              let cls = "text-[12px] w-full aspect-square flex items-center justify-center rounded-full transition-all cursor-pointer hover:bg-[#E6F7F5] ";

              if (disabled) {
                cls = "text-[12px] w-full aspect-square flex items-center justify-center rounded-full text-[#CBD5E1] cursor-not-allowed ";
              } else if (isStart || isEnd) {
                cls = "text-[12px] w-full aspect-square flex items-center justify-center rounded-full bg-[#0E9F8E] text-white font-bold cursor-pointer ";
              } else if (inRange) {
                cls = "text-[12px] w-full aspect-square flex items-center justify-center rounded-full bg-[#E6F7F5] text-[#0E2A47] cursor-pointer ";
              }

              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => !disabled && handleDayClick(day)}
                  className={cls}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Selected range display */}
          {(startDate || endDate) && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B8299] border-t border-[#E2E8EE] pt-2">
              <span>
                {startDate ? fmt(startDate) : "..."} → {endDate ? fmt(endDate) : "..."}
              </span>
              <button onClick={handleClear} className="text-[#94A3B8] hover:text-[#6B8299]">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 text-[12px] font-medium text-[#6B8299] border border-[#E2E8EE] rounded-lg py-1.5 hover:bg-[#F1F5F9] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              disabled={!startDate || !endDate}
              className="flex-1 text-[12px] font-medium text-white bg-[#0E9F8E] rounded-lg py-1.5 hover:bg-[#0D8E7F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
