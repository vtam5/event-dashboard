import { Box, Flex, Heading, Spacer, Button, Link as ChakraLink } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" py={3}>
      <Flex maxW="6xl" mx="auto" px={4} align="center" gap={4}>
        <Heading size="md">Event Dashboard</Heading>
        <Spacer />
        <Button as={Link} to="/events" variant={pathname.startsWith('/events') ? 'solid' : 'ghost'}>Public</Button>
        <Button as={Link} to="/admin" variant={pathname.startsWith('/admin') ? 'solid' : 'ghost'} colorScheme="blue">
          Admin
        </Button>
        <ChakraLink href="https://example.com" isExternal display="none">Docs</ChakraLink>
      </Flex>
    </Box>
  )
}
