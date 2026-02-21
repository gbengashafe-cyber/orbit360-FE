// Test file to verify calculateBusinessDays works correctly
// Run this in browser console to test

const calculateBusinessDays = (startDate, endDate, period = 'full_day') => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Handle same day half day
  if (period !== 'full_day' && start.toDateString() === end.toDateString()) {
    return 0.5;
  }

  let count = 0;
  const currentDate = new Date(start);

  console.log('Start:', start.toDateString(), '(' + getDayName(start.getDay()) + ')');
  console.log('End:', end.toDateString(), '(' + getDayName(end.getDay()) + ')');
  console.log('---');

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const dayName = getDayName(dayOfWeek);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    console.log(currentDate.toDateString(), `(${dayName})`, isWeekend ? '❌ SKIP (weekend)' : '✅ COUNT');
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

// Test Cases
console.log('\n=== TEST 1: Friday (Jan 31) to Monday (Feb 3) ===');
const result1 = calculateBusinessDays('2026-01-31', '2026-02-03', 'full_day');
console.log('Result:', result1, 'days (should be 3)');

console.log('\n=== TEST 2: Monday (Feb 3) to Friday (Feb 7) ===');
const result2 = calculateBusinessDays('2026-02-03', '2026-02-07', 'full_day');
console.log('Result:', result2, 'days (should be 5)');

console.log('\n=== TEST 3: Monday (Feb 3) same day half-day ===');
const result3 = calculateBusinessDays('2026-02-03', '2026-02-03', 'half_day_morning');
console.log('Result:', result3, 'days (should be 0.5)');

console.log('\n=== TEST 4: Wednesday (Jan 29) to Sunday (Feb 2) ===');
const result4 = calculateBusinessDays('2026-01-28', '2026-02-02', 'full_day');
console.log('Result:', result4, 'days (should exclude Sat & Sun)');
