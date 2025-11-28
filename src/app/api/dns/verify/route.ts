import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns/promises'

/**
 * DNS Verification API Endpoint
 * Performs DNS lookups server-side
 */
export async function POST(request: NextRequest) {
    try {
        const { hostname, expectedIPs } = await request.json()

        if (!hostname) {
            return NextResponse.json(
                { error: 'Hostname is required' },
                { status: 400 }
            )
        }

        const result = await performDNSLookup(hostname, expectedIPs || [])

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('DNS verification error:', error)
        return NextResponse.json(
            {
                success: false,
                records: {},
                errors: [error.message],
                pointsToUs: false
            },
            { status: 500 }
        )
    }
}

async function performDNSLookup(hostname: string, expectedIPs: string[]) {
    const records: any = {}
    const errors: string[] = []
    let success = true

    // A Records (IPv4)
    try {
        records.a = await dns.resolve4(hostname)
    } catch (error: any) {
        if (error.code !== 'ENODATA' && error.code !== 'ENOTFOUND') {
            errors.push(`A record lookup failed: ${error.message}`)
            success = false
        }
    }

    // AAAA Records (IPv6)
    try {
        records.aaaa = await dns.resolve6(hostname)
    } catch (error: any) {
        // IPv6 is optional, don't mark as failure
        if (error.code !== 'ENODATA' && error.code !== 'ENOTFOUND') {
            console.log(`AAAA record lookup note: ${error.message}`)
        }
    }

    // CNAME Records
    try {
        records.cname = await dns.resolveCname(hostname)
    } catch (error: any) {
        // CNAME is optional
        if (error.code !== 'ENODATA' && error.code !== 'ENOTFOUND') {
            console.log(`CNAME record lookup note: ${error.message}`)
        }
    }

    // MX Records
    try {
        const mxRecords = await dns.resolveMx(hostname)
        records.mx = mxRecords.map(r => r.exchange)
    } catch (error: any) {
        // MX is optional
    }

    // TXT Records
    try {
        const txtRecords = await dns.resolveTxt(hostname)
        records.txt = txtRecords.map(r => r.join(''))
    } catch (error: any) {
        // TXT is optional
    }

    // Check if DNS points to our platform
    const allIPs = [...(records.a || []), ...(records.aaaa || [])]
    const pointsToUs = expectedIPs.length > 0
        ? allIPs.some(ip => expectedIPs.includes(ip))
        : allIPs.length > 0 // If no expected IPs, just check if any records exist

    return {
        success,
        records,
        errors: errors.length > 0 ? errors : undefined,
        pointsToUs
    }
}
