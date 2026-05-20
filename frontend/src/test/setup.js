/* eslint-disable no-undef */

// Mock generic asset helper
vi.mock('@/utils/assetHelper', () => ({
  getImageUrl: (category, name) => `/mock-image/${category}/${name}.png`,
  getActionIcon: (name) => `/mock-icon/${name}.png`,
}))

// Add global mocks or plugins here
// config.global.plugins = [pinia]
// config.global.mocks = { $router: mockRouter }
