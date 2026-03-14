import { getImageUrl } from './assetHelper'

/**
 * Returns the appropriate icon path for a given course name.
 *
 * @param {string} courseName
 */
export const getCourseIcon = (courseName) => {
  // Maps course name to card asset
  return getImageUrl(`classes/card-${courseName.toLowerCase()}`)
}
