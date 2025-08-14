import {
  Table, Thead, Tbody, Tr, Th, Td,
  IconButton, Box, HStack, Menu, MenuButton, MenuList, MenuItem, Text, Tooltip,
} from "@chakra-ui/react";
import { Edit, Settings, Users } from "react-feather";
import StatusPill from "./StatusPill.jsx";

// ---- util formatters
const pad = (n) => String(n).padStart(2, "0");

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d)) return "—";
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
}

function fmtTime(val) {
  if (!val) return "—";
  let H, M;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) {
    const [h, m] = val.split(":");
    H = +h; M = +m;
  } else {
    const d = new Date(val);
    if (Number.isNaN(d)) return "—";
    H = d.getHours(); M = d.getMinutes();
  }
  const ampm = H >= 12 ? "PM" : "AM";
  const h12 = H % 12 || 12;
  return `${h12}:${pad(M)} ${ampm}`;
}

// ---- NEW: derive display status safely (works with old isPublished too)
function effectiveStatus(e) {
  let s = String(e.status || "").toLowerCase();

  // If backend says open but guards say closed, display CLOSED
  if (s === "open" && (e.capacityFull || e.closeOnPassed || e.isPast)) {
    s = "closed";
  }

  // Back-compat: map legacy isPublished when status missing
  if (!s) {
    const ip = String(e.isPublished || "").toLowerCase();
    if (ip === "public" || ip === "published" || ip === "true") s = "open";
    else if (ip === "draft" || ip === "false") s = "private";
  }

  return s || "unknown";
}

const STATUS_OPTIONS = [
  { value: 'private',  label: 'Private'  },
  { value: 'open',     label: 'Open'     },
  { value: 'closed',   label: 'Closed'   },
  { value: 'archived', label: 'Archived' },
];

export default function EventList({
  items,
  onPreviewEvent,
  onOpenParticipants,
  onEditEvent,
  onDeleteEvent,
  onChangeStatus, // optional: if provided, status pill becomes a dropdown
}) {
  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" boxShadow="sm">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th w="56px" textAlign="center">#</Th>
            <Th textAlign="left" w="25%">Name</Th>
            <Th w="120px" textAlign="center">Date</Th>
            <Th w="90px" textAlign="center">Start</Th>
            <Th w="90px" textAlign="center">End</Th>
            <Th w="28%" textAlign="left">Location</Th>
            <Th w="70px" textAlign="center" pr={0}>
              <Users size={14} style={{ display: "inline" }} />
            </Th>
            <Th w="110px" textAlign="center" pr={0}>Status</Th>
            <Th w="90px" textAlign="center">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((event, idx) => {
            const s = effectiveStatus(event);
            return (
              <Tr key={event.eventId} _hover={{ bg: "gray.50" }}>
                <Td textAlign="center">{idx + 1}</Td>

                {/* Name */}
                <Td
                  cursor="pointer"
                  onClick={() => onPreviewEvent?.(event)}
                  fontWeight="medium"
                  maxW="250px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  textAlign="left"
                >
                  {event.name || "Untitled"}
                </Td>

                {/* Date / Start / End */}
                <Td whiteSpace="nowrap" textAlign="center">{fmtDate(event.date)}</Td>
                <Td whiteSpace="nowrap" textAlign="center">{fmtTime(event.time)}</Td>
                <Td whiteSpace="nowrap" textAlign="center">{fmtTime(event.endTime)}</Td>

                {/* Location */}
                <Td whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" maxW="240px" textAlign="left">
                  <Text noOfLines={1}>{event.location || "—"}</Text>
                </Td>

                {/* Participants */}
                <Td textAlign="center" pr={0} verticalAlign="middle">
                  <Text
                    as="span"
                    cursor="pointer"
                    color="blue.600"
                    fontWeight="semibold"
                    onClick={() => onOpenParticipants?.(event)}
                  >
                    {event.responsesCount ?? event.participantCount ?? 0}
                  </Text>
                </Td>

                {/* Status */}
                <Td textAlign="center" pr={0} verticalAlign="middle">
                  {onChangeStatus ? (
                    <Menu placement="bottom">
                      <Tooltip label="Change status">
                        <MenuButton as="span" style={{ cursor: "pointer", display: "inline-block" }}>
                          <StatusPill state={s} />
                        </MenuButton>
                      </Tooltip>
                      <MenuList>
                        {STATUS_OPTIONS.map(opt => (
                          <MenuItem
                            key={opt.value}
                            onClick={() => onChangeStatus(event, opt.value)}
                          >
                            {opt.label}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  ) : (
                    <Tooltip label="Open editor">
                      <span>
                        <StatusPill
                          state={s}
                          onClick={() => onEditEvent?.(event)}
                          style={{ cursor: "pointer" }}
                        />
                      </span>
                    </Tooltip>
                  )}
                </Td>

                {/* Actions */}
                <Td textAlign="center" verticalAlign="middle">
                  <HStack spacing={1} justify="center">
                    <IconButton
                      icon={<Edit size={14} />}
                      size="sm"
                      variant="ghost"
                      aria-label="Edit"
                      onClick={() => onEditEvent?.(event)}
                    />
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<Settings size={14} />}
                        size="sm"
                        variant="ghost"
                        aria-label="More"
                      />
                      <MenuList>
                        <MenuItem icon={<Edit size={14} />} onClick={() => onEditEvent?.(event)}>
                          Edit
                        </MenuItem>
                        <MenuItem onClick={() => onDeleteEvent?.(event)}>
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
