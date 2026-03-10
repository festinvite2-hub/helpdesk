export function createTicketMock(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        ticket_id: 'TICK-001',
        payload,
      })
    }, 1000)
  })
}
