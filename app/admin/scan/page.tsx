import { wajibAdmin } from '@/lib/admin'
import Scanner from './scanner'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await wajibAdmin()
  return <Scanner />
}
