import { useEffect, useState } from 'react'
import {
  SimpleGrid, GridItem, FormControl, FormLabel, Input, Select, Switch,
  NumberInput, NumberInputField, Textarea, HStack, Image, Button, Stack
} from '@chakra-ui/react'
import { uploadFile } from '../../services/eventService' // generic /api/upload → { path, flyerPath }

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

export default function EventFormFields({ values, setValues }) {
  const [flyerPreview, setFlyerPreview] = useState('')

  useEffect(() => {
    const p = values?.flyerPath || ''
    if (!p) return setFlyerPreview('')
    const url = /^(https?:|data:|blob:)/i.test(p) ? p : `${BASE}${p.startsWith('/') ? p : `/${p}`}`
    setFlyerPreview(url)
  }, [values?.flyerPath])

  async function onChooseFlyer(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const { flyerPath, path } = await uploadFile(f)
    const fp = flyerPath || path // server returns both; either works
    setValues(v => ({ ...v, flyerPath: fp }))
    // show local preview immediately
    try { setFlyerPreview(URL.createObjectURL(f)) } catch {}
  }

  function clearFlyer() {
    setValues(v => ({ ...v, flyerPath: '' }))
    setFlyerPreview('')
  }

  // Tiny helper so switches line up with inputs
  const SwitchRow = ({ label, isChecked, onChange }) => (
    <HStack justify="space-between" h="40px">
      <FormLabel mb="0">{label}</FormLabel>
      <Switch isChecked={isChecked} onChange={onChange} />
    </HStack>
  )

  return (
    // 12-col grid: clean halves/thirds and tight alignment
    <SimpleGrid columns={{ base: 1, md: 12 }} columnGap={4} rowGap={3}>
      {/* Row 1 */}
      <GridItem colSpan={{ base: 12, md: 6 }}>
        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input value={values.name || ''} onChange={e=>setValues(v=>({...v, name: e.target.value}))} />
        </FormControl>
      </GridItem>
      <GridItem colSpan={{ base: 12, md: 3 }}>
        <FormControl>
          <FormLabel>Date</FormLabel>
          <Input type="date" value={values.date || ''} onChange={e=>setValues(v=>({...v, date: e.target.value}))} />
        </FormControl>
      </GridItem>
      <GridItem colSpan={{ base: 12, md: 3 }}>
        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select
            value={values.status || 'private'}
            onChange={e=>setValues(v=>({...v, status: e.target.value}))}
          >
            <option value="private">Private</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </Select>
        </FormControl>
      </GridItem>

      {/* Row 2 */}
      <GridItem colSpan={{ base: 12, md: 3 }}>
        <FormControl>
          <FormLabel>Start Time</FormLabel>
          <Input type="time" value={values.time || ''} onChange={e=>setValues(v=>({...v, time: e.target.value}))} />
        </FormControl>
      </GridItem>
      <GridItem colSpan={{ base: 12, md: 3 }}>
        <FormControl>
          <FormLabel>End Time</FormLabel>
          <Input type="time" value={values.endTime || ''} onChange={e=>setValues(v=>({...v, endTime: e.target.value}))} />
        </FormControl>
      </GridItem>

      {/* Row 3 — Location full width */}
      <GridItem colSpan={{ base: 12, md: 12 }}>
        <FormControl>
          <FormLabel>Location</FormLabel>
          <Input value={values.location || ''} onChange={e=>setValues(v=>({...v, location: e.target.value}))} />
        </FormControl>
      </GridItem>

      {/* Row 4 */}
      <GridItem colSpan={{ base: 12, md: 12 }}>
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea rows={3} value={values.description || ''} onChange={e=>setValues(v=>({...v, description: e.target.value}))} />
        </FormControl>
      </GridItem>

      {/* Row 5 — flyer */}
      <GridItem colSpan={{ base: 12, md: 12 }}>
        <FormControl>
          <FormLabel>Flyer</FormLabel>
          <HStack justify="space-between" w="100%">
            <Input type="file" accept="image/*,.pdf" onChange={onChooseFlyer} />
            {flyerPreview ? (
              <HStack>
                <Image src={flyerPreview} alt="Flyer" maxH="80px" rounded="md" />
                <Button size="sm" variant="outline" onClick={clearFlyer}>Remove</Button>
              </HStack>
            ) : null}
          </HStack>
        </FormControl>
      </GridItem>

      {/* Row 6 — left inputs (Capacity, Close On) */}
      <GridItem colSpan={{ base: 12, md: 6 }}>
        <Stack spacing={3}>
          <FormControl>
            <FormLabel>Capacity</FormLabel>
            <NumberInput min={0} value={values.capacityLimit ?? ''} onChange={(_, n)=>setValues(v=>({...v, capacityLimit: Number.isFinite(n)? n : ''}))}>
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Close On</FormLabel>
            <Input
              type="datetime-local"
              value={values.closeOn || ''}
              onChange={e=>setValues(v=>({...v, closeOn: e.target.value}))}
            />
          </FormControl>
        </Stack>
      </GridItem>

      {/* Row 6 — right switches */}
      <GridItem colSpan={{ base: 12, md: 6 }}>
        <Stack spacing={3} mt={{ base: 0, md: 1 }}>
          <SwitchRow
            label="Allow Response Edit"
            isChecked={!!values.allowResponseEdit}
            onChange={e=>setValues(v=>({...v, allowResponseEdit: e.target.checked}))}
          />
          <SwitchRow
            label="Email Confirmation"
            isChecked={!!values.emailConfirmation}
            onChange={e=>setValues(v=>({...v, emailConfirmation: e.target.checked}))}
          />
        </Stack>
      </GridItem>
    </SimpleGrid>
  )
}
