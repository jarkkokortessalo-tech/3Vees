import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rohjtuvkgjkrguvpsqpa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvaGp0dXZrZ2prcmd1dnBzcXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzYwNDEsImV4cCI6MjA4OTYxMjA0MX0.4iSsV8C7jTOKunWZWDoRbQDnKRMXHHGiYTdoYILJxYk'

export const supabase = createClient(supabaseUrl, supabaseKey)