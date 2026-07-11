import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { analyzeInspoJob } from '@/lib/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeInspoJob],
})