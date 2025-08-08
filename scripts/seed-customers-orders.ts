import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to generate a date range
function generateDateRange(days: number): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date)
  }
  
  return dates
}

// Generate random number with some variation
function randomInRange(min: number, max: number, trend: number = 0): number {
  const base = Math.random() * (max - min) + min
  return Math.round(base * (1 + trend))
}

async function seedCustomersAndOrders() {
  try {
    // Get the first site
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, business_name')
      .limit(1)

    if (sitesError || !sites || sites.length === 0) {
      console.error('Error fetching sites:', sitesError)
      return
    }

    const siteId = sites[0].id
    console.log(`\nSeeding customers and orders for site: ${sites[0].business_name} (${siteId})`)

    // First, create some test users in auth.users table
    const customerData = [
      { name: 'John Doe', email: 'john.doe@example.com' },
      { name: 'Jane Smith', email: 'jane.smith@example.com' },
      { name: 'Bob Johnson', email: 'bob.johnson@example.com' },
      { name: 'Alice Williams', email: 'alice.williams@example.com' },
      { name: 'Charlie Brown', email: 'charlie.brown@example.com' },
      { name: 'Diana Prince', email: 'diana.prince@example.com' },
      { name: 'Edward Norton', email: 'edward.norton@example.com' },
      { name: 'Fiona Apple', email: 'fiona.apple@example.com' },
      { name: 'George Lucas', email: 'george.lucas@example.com' },
      { name: 'Helen Mirren', email: 'helen.mirren@example.com' },
    ]

    console.log('Creating test customers...')
    const customerIds: { [email: string]: string } = {}

    // Create users using the admin API
    for (const customer of customerData) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: customer.email,
        password: 'testpassword123', // Default password for test users
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          full_name: customer.name,
        }
      })

      if (userError) {
        console.error(`Error creating user ${customer.email}:`, userError.message)
        // Try to get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === customer.email)
        if (existingUser) {
          customerIds[customer.email] = existingUser.id
          console.log(`Using existing user ${customer.email}`)
        }
      } else if (userData?.user) {
        customerIds[customer.email] = userData.user.id
        console.log(`Created user ${customer.email}`)
      }
    }

    console.log(`\nCreated/found ${Object.keys(customerIds).length} customers`)

    // Generate orders for the last 30 days
    const orders = []
    const orderDates = generateDateRange(30)
    let orderCount = 0
    
    for (const date of orderDates) {
      const dayIndex = orderDates.indexOf(date)
      const trend = dayIndex / orderDates.length
      
      // Generate 2-15 orders per day with increasing trend
      const dailyOrderCount = randomInRange(2, 15, trend * 0.5)
      
      for (let i = 0; i < dailyOrderCount; i++) {
        const orderDate = new Date(date)
        orderDate.setHours(
          randomInRange(8, 20), // Business hours
          randomInRange(0, 59),
          randomInRange(0, 59)
        )
        
        orderCount++
        const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(orderCount).padStart(4, '0')}`
        
        // Pick a random customer
        const customerEmails = Object.keys(customerIds)
        const customerEmail = customerEmails[Math.floor(Math.random() * customerEmails.length)]
        const customerId = customerIds[customerEmail]
        const customerName = customerData.find(c => c.email === customerEmail)?.name || 'Unknown'
        
        // Older orders more likely to be delivered
        let status = 'processing'
        if (dayIndex < 20) status = 'shipped'
        if (dayIndex < 15) status = 'delivered'
        if (Math.random() < 0.05) status = 'cancelled' // 5% cancellation rate
        
        orders.push({
          site_id: siteId,
          order_number: orderNumber,
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          status: status,
          total_amount: randomInRange(50, 500, 0),
          items_count: randomInRange(1, 5, 0),
          created_at: orderDate.toISOString(),
          updated_at: orderDate.toISOString(),
          shipped_at: status === 'shipped' || status === 'delivered' ? new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
          delivered_at: status === 'delivered' ? new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
          cancelled_at: status === 'cancelled' ? new Date(orderDate.getTime() + 2 * 60 * 60 * 1000).toISOString() : null,
          billing_address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            country: 'US'
          },
          shipping_address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
            country: 'US'
          }
        })
      }
    }

    console.log(`\nInserting ${orders.length} orders...`)
    
    // Insert orders in batches to avoid timeouts
    const batchSize = 50
    let insertedCount = 0
    
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .insert(batch)
        .select()

      if (ordersError) {
        console.error(`Error inserting orders batch ${i / batchSize + 1}:`, ordersError)
      } else {
        insertedCount += ordersData.length
        console.log(`Inserted batch ${i / batchSize + 1} (${ordersData.length} orders)`)
      }
    }

    console.log(`\n✅ Successfully inserted ${insertedCount} orders`)

    // Update site metrics with actual order data
    console.log('\nUpdating site metrics with order counts...')
    
    for (const date of orderDates) {
      const dateStr = date.toISOString().split('T')[0]
      
      // Count orders for this date
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('created_at', dateStr + 'T00:00:00')
        .lt('created_at', dateStr + 'T23:59:59')
      
      // Update the site_metrics table
      const { error: updateError } = await supabase
        .from('site_metrics')
        .update({ 
          inquiry_count: orderCount || 0  // Store order count in inquiry_count field
        })
        .eq('site_id', siteId)
        .eq('metric_date', dateStr)
      
      if (updateError) {
        console.error(`Error updating metrics for ${dateStr}:`, updateError)
      }
    }

    console.log('\n✨ All customer and order data has been successfully seeded!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  } finally {
    process.exit(0)
  }
}

seedCustomersAndOrders()