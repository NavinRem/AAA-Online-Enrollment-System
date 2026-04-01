import { parseDate } from './dateFormatter'
import { isPaid } from './statusHelper'

/**
 * Calculates dashboard statistics based on the provided data arrays.
 */
export const calculateDashboardStats = (allUsers, enrollments, programs, students) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1
  const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000

  const getExpectedAmount = (r) => {
    let amt = 0
    if (r.amount) amt = parseFloat(String(r.amount).replace(/[^0-9.]/g, ''))
    else if (r.totalAmount) amt = parseFloat(String(r.totalAmount).replace(/[^0-9.]/g, ''))
    else {
      const progId = r.programId || r.courseId
      const program = programs.find((c) => (c.id || c.uid) === progId)
      amt = program ? parseFloat(String(program.price || 0).replace(/[^0-9.]/g, '')) : 0
    }
    return isNaN(amt) ? 0 : amt
  }

  const todayAccounts = (allUsers || []).filter((u) => {
    if (u.role !== "parent" && u.role !== "guardian") return false;
    const time = parseDate(u.createdAt || u.updatedAt).getTime();
    return time >= startOfToday && time <= endOfToday;
  });

  const weeklyAccounts = (allUsers || []).filter((u) => {
    if (u.role !== "parent" && u.role !== "guardian") return false;
    const time = parseDate(u.createdAt || u.updatedAt).getTime();
    return time >= startOf7DaysAgo && time <= endOfToday;
  });

  const parents = (allUsers || []).filter((u) => u.role === "parent");
  const guardians = (allUsers || []).filter((u) => u.role === "guardian");

  // Helper to check if a record's relevant activity (enrollment or payment) happened in a window
  const isRecordInWindow = (r, start, end) => {
    const enrollTime = parseDate(r.enrollAt || r.createdAt).getTime();
    const updateTime = parseDate(r.updatedAt).getTime();
    return (
      (enrollTime >= start && enrollTime <= end) ||
      (updateTime >= start && updateTime <= end)
    );
  };

  const todayEnrollmentsList = (enrollments || []).filter((r) => {
    const time = parseDate(r.enrollAt || r.createdAt).getTime();
    return time >= startOfToday && time <= endOfToday;
  });

  const weeklyEnrollmentsList = (enrollments || []).filter((r) => {
    const time = parseDate(r.enrollAt || r.createdAt).getTime();
    return time >= startOf7DaysAgo && time <= endOfToday;
  });

  const todayPaidSum = (enrollments || [])
    .filter((r) => isPaid(r.status || r.paymentStatus) && isRecordInWindow(r, startOfToday, endOfToday))
    .reduce((sum, r) => sum + getExpectedAmount(r), 0);

  const weeklyPaidSum = (enrollments || [])
    .filter((r) => isPaid(r.status || r.paymentStatus) && isRecordInWindow(r, startOf7DaysAgo, endOfToday))
    .reduce((sum, r) => sum + getExpectedAmount(r), 0);

  return {
    today: {
      reg: todayAccounts.length,
      enroll: todayEnrollmentsList.length,
      pay: Math.round(todayPaidSum * 100) / 100,
    },
    week: {
      reg: weeklyAccounts.length,
      enroll: weeklyEnrollmentsList.length,
      pay: Math.round(weeklyPaidSum * 100) / 100,
    },
    totals: {
      accounts: parents.length + guardians.length,
      parents: parents.length,
      guardians: guardians.length,
      students: (students || []).length,
      programs: (programs || []).length,
    },
  };
};
