// src/components/Event/StatusPill.jsx
import { Badge } from '@chakra-ui/react';
export default function StatusPill({ state }) {
  const s = String(state || '').toLowerCase();
  const map = {
    private:  { colorScheme: 'yellow', text: 'PRIVATE' },
    open:     { colorScheme: 'green',  text: 'OPEN' },
    closed:   { colorScheme: 'orange', text: 'CLOSED' },
    archived: { colorScheme: 'gray',   text: 'ARCHIVED' },
  };
  const m = map[s] || { colorScheme: 'gray', text: s || 'UNKNOWN' };
  return <Badge colorScheme={m.colorScheme}>{m.text}</Badge>;
}
