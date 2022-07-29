const hashi = require('@devprotocol/hashi/config/purgecss')
const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    purgecss(
      hashi.purgeConfig({
        content: ['**/*.astro', '**/*.vue'],
      })
    ),
  ],
}
