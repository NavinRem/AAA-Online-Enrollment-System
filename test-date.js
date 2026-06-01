const isSessionDisabled = (sessionDate, enrollAt) => {
  const sDate = new Date(sessionDate).setHours(0,0,0,0)
  const eDate = enrollAt ? new Date(enrollAt).setHours(0,0,0,0) : 0
  const now = new Date().setHours(0,0,0,0)
  return sDate > now || (eDate && sDate < eDate)
}
console.log(isSessionDisabled('2026-05-23', '2026-06-01'));
