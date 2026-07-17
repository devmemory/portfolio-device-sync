export const MAIN_BTN_TEXT = [
  {
    title: "Local connection",
    description: "Check whether the device agent is available.",
  },
  {
    title: "Pair token",
    description: "Request a server token before pairing.",
  },
  {
    title: "Device actions",
    description: "Send AMQP messages and manage registrations.",
  },
] as const;

export const MAIN_FLOW_TEXT = [
  { title: "Connect", description: "Verify the local AMQP device helper." },
  { title: "Pair", description: "Set the device info and register it." },
  {
    title: "Send",
    description: "Trigger a test message from the device list.",
  },
] as const;
