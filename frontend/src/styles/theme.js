// src/styles/theme.js
import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif'
  },
  components: {
    Button: { baseStyle: { borderRadius: 'lg' } },
    Input: { baseStyle: { borderRadius: 'md' } }
  }
})

export default theme
