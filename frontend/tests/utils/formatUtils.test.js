/* eslint-disable */
import { calculateClassProgress } from '../../src/utils/formatUtils.js';

// Setup mock date
let mockToday = null;
const OriginalDate = global.Date;

class MockDate extends OriginalDate {
  constructor(...args) {
    if (args.length === 0 && mockToday) {
      super(mockToday);
    } else {
      super(...args);
    }
  }
  static now() {
    return mockToday ? new OriginalDate(mockToday).getTime() : OriginalDate.now();
  }
}
global.Date = MockDate;

console.log("Running Schedule-Aware Session Progress Tests...\n");

// Test Setup: Term starts Thu May 28, Class is Saturday May 30
const termStart = '2026-05-28';
const termEnd = '2026-08-08'; // 11 sessions
const classDay = 'Saturday';
const totalSessions = 11;

const testCases = [
  { name: 'Friday before class (Upcoming)', today: '2026-05-29' },
  { name: 'Saturday (First Class Day)', today: '2026-05-30' },
  { name: 'Sunday (Day After First Class)', today: '2026-05-31' },
  { name: 'Next Friday (Before Second Class)', today: '2026-06-05' },
  { name: 'Second Saturday (Second Class Day)', today: '2026-06-06' },
  { name: 'Sunday After Second Class', today: '2026-06-07' },
  { name: 'Sunday After Last Class (Archived)', today: '2026-08-09' }
];

testCases.forEach(tc => {
  mockToday = new OriginalDate(tc.today + 'T12:00:00+07:00');
  
  const result = calculateClassProgress(termStart, termEnd, classDay, null, totalSessions);
  
  console.log(`--- [${tc.name}] - Today is: ${tc.today} ---`);
  console.log(`Status:            ${result.status}`);
  console.log(`Current Week:      ${result.week}`);
  console.log(`Remaining Sessions:${result.remainingSessions}`);
  console.log(`Week Info:         ${result.weekInfo}`);
  console.log(`Percentage:        ${result.percentage}%`);
  console.log('');
});
