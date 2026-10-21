// Author: Minh Huy Loi
import { delay } from 'msw'

export async function simulateLatency() {
  await delay(300 + Math.random() * 200)
}
