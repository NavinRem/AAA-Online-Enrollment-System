import { getImageUrl } from './assetHelper'

/**
 * Returns the appropriate icon path for a given program name.
 *
 * @param {string} programName
 */
export const getProgramIcon = (programName) => {
  // Maps program name to card asset
  if (!programName) return getImageUrl('programs/program')
  return getImageUrl(`classes/card-${programName.toLowerCase()}`)
}
