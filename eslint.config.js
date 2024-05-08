import config from "eslint-config-current-thing"

export default [
  {
    ignores: ['vite.config.ts']
  },
  ...config(),
]
