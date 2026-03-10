import { getImageUrl } from './assetHelper'

/**
 * Returns the appropriate icon path for a given course name.
 *
 * @param {string} courseName
 */
export const getCourseIcon = (courseName) => {
  return getImageUrl(courseName)
}
