// Main function entry point for Edge Runtime
// This is a placeholder that routes requests to other functions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req: Request) => {
  const url = new URL(req.url)
  const path = url.pathname
  
  // Health check endpoint
  if (path === "/health" || path === "/") {
    return new Response(
      JSON.stringify({ status: "ok", message: "Edge Functions are running" }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )
  }

  // Route to other functions based on path
  // Example: /hello-world -> ./hello-world/index.ts
  const functionPath = path.slice(1) // Remove leading slash
  
  try {
    // In production, you would dynamically import and execute the function
    // For now, return a placeholder response
    return new Response(
      JSON.stringify({ 
        message: `Function '${functionPath}' not found`,
        availableFunctions: ["main"]
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 404 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})