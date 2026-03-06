/**
 * Returns the appropriate icon path for a given course name.
 *
 * @param {string} courseName - The name of the course
 * @returns {string} The path to the course icon image
 */
export const getCourseIcon = (courseName) => {
  const name = (courseName || '').toLowerCase()
  if (name.includes('piano')) return '/src/assets/images/piano-class.png'
  if (name.includes('robotic')) return '/src/assets/images/robotic-class.png'
  if (name.includes('ballet')) return '/src/assets/images/ballet-class.png'
  return '/src/assets/images/program.png' // default fallback icon
}
