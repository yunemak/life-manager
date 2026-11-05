import type { Habit, HabitCompletion, HabitFrequency, HabitPeriod } from '../../domain'
import { localDate } from '../../domain'

export type HabitDayState = 'completed' | 'skipped' | 'missed' | 'future' | 'unscheduled' | 'pending'
export interface HabitStats { currentStreak: number; longestStreak: number; completionRate: number; consistencyScore: number; currentPeriodProgress: number; periodLabel: string }

export function localDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

export function shiftDay(value: string, amount: number): string {
  const date = localDay(value)
  date.setDate(date.getDate() + amount)
  return localDate(date)
}

export function periodStart(value: string, period: HabitPeriod): string {
  const date = localDay(value)
  if (period === 'weekly') date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  if (period === 'monthly') date.setDate(1)
  return localDate(date)
}

export function getFrequency(habit: Habit): HabitFrequency {
  return habit.frequency ?? { period: 'daily', target: 1, weekdays: habit.schedule?.length ? habit.schedule : [0,1,2,3,4,5,6] }
}

export function isScheduled(habit: Habit, day: string): boolean {
  const frequency = getFrequency(habit)
  if (frequency.period !== 'daily') return true
  return (frequency.weekdays?.length ? frequency.weekdays : habit.schedule).includes(localDay(day).getDay())
}

export function dayState(habit: Habit, day: string, completions: HabitCompletion[], today = localDate()): HabitDayState {
  if (day < habit.localDate) return 'unscheduled'
  if (day > today) return 'future'
  const completion = completions.find(item => item.habitId === habit.id && item.localDate === day)
  if (completion?.status === 'skipped') return 'skipped'
  if (completion) return 'completed'
  const frequency = getFrequency(habit)
  if (frequency.period === 'daily' && !isScheduled(habit, day)) return 'unscheduled'
  if (frequency.period === 'daily') return 'missed'
  const periodEnd = frequency.period === 'weekly' ? shiftDay(periodStart(day, 'weekly'), 6) : shiftDay(periodStart(day, 'monthly'), daysInMonth(day) - 1)
  if (periodEnd >= today) return 'pending'
  const count = completions.filter(item => item.habitId === habit.id && item.status !== 'skipped' && periodStart(item.localDate, frequency.period) === periodStart(day, frequency.period)).length
  return count >= frequency.target ? 'unscheduled' : 'missed'
}

function daysInMonth(day: string): number {
  const date = localDay(day)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function periodKey(day: string, period: HabitPeriod): string { return periodStart(day, period) }
function successForPeriod(habit: Habit, periodKeyValue: string, completions: HabitCompletion[]): boolean {
  const frequency = getFrequency(habit)
  if (frequency.period === 'daily') return completions.some(c => c.habitId === habit.id && c.localDate === periodKeyValue && c.status !== 'skipped')
  return completions.filter(c => c.habitId === habit.id && c.status !== 'skipped' && periodKey(c.localDate, frequency.period) === periodKeyValue).length >= frequency.target
}

export function habitStats(habit: Habit, completions: HabitCompletion[], today = localDate()): HabitStats {
  const frequency = getFrequency(habit)
  const created = habit.localDate > today ? today : habit.localDate
  let period = periodKey(today, frequency.period)
  const periods: string[] = []
  while (period >= periodKey(created, frequency.period)) {
    if (frequency.period !== 'daily' || isScheduled(habit, period)) periods.push(period)
    if (frequency.period === 'daily') period = shiftDay(period, -1)
    else if (frequency.period === 'weekly') period = shiftDay(period, -7)
    else { const date = localDay(period); date.setDate(0); period = localDate(date) }
    if (periods.length > 5000) break
  }
  const currentHasGoal = successForPeriod(habit, periods[0] ?? periodKey(today, frequency.period), completions)
  let currentStreak = 0
  let skippedCurrent = false
  for (const key of periods) {
    if (successForPeriod(habit, key, completions)) currentStreak++
    else if (!skippedCurrent && key === periods[0] && frequency.period !== 'daily' && !currentHasGoal) skippedCurrent = true
    else break
  }
  const closedPeriods = periods.filter((_, index) => index > 0 || frequency.period === 'daily')
  let longestStreak = 0, run = 0
  for (const key of [...closedPeriods].reverse()) {
    if (successForPeriod(habit, key, completions)) { run++; longestStreak = Math.max(longestStreak, run) }
    else run = 0
  }
  longestStreak = Math.max(longestStreak, currentStreak)
  let opportunities = 0, achieved = 0
  if (frequency.period === 'daily') {
    for (let day = created; day <= today; day = shiftDay(day, 1)) {
      if (isScheduled(habit, day)) {
        opportunities++
        if (successForPeriod(habit, day, completions)) achieved++
      }
      if (opportunities > 5000) break
    }
  } else {
    for (const key of periods) {
      const isCurrent = key === periods[0]
      if (!isCurrent || successForPeriod(habit, key, completions)) {
        opportunities++
        if (successForPeriod(habit, key, completions)) achieved++
      }
    }
  }
  const currentCount = frequency.period === 'daily'
    ? Number(successForPeriod(habit, periodKey(today, 'daily'), completions))
    : completions.filter(c => c.habitId === habit.id && c.status !== 'skipped' && periodKey(c.localDate, frequency.period) === periods[0]).length
  const consistencyPeriods=periods.filter((key,index)=>frequency.period==='daily'?key<today||successForPeriod(habit,key,completions):index>0||successForPeriod(habit,key,completions)).slice(0,14)
  let weightedTotal=0,weightSum=0
  consistencyPeriods.forEach((key,index)=>{const weight=0.92**index;weightSum+=weight;if(successForPeriod(habit,key,completions))weightedTotal+=weight})
  return {
    currentStreak,
    longestStreak,
    completionRate: opportunities ? Math.round(achieved / opportunities * 100) : 0,
    consistencyScore: weightSum ? Math.round(weightedTotal / weightSum * 100) : 0,
    currentPeriodProgress: frequency.period === 'daily' ? currentCount : Math.min(currentCount, frequency.target),
    periodLabel: frequency.period === 'daily' ? 'gün' : frequency.period === 'weekly' ? 'hafta' : 'ay',
  }
}
