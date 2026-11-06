import { readFile } from 'node:fs/promises';

export const dynamic = 'force-dynamic';

export async function GET() {
  const source = process.env.VEHICLE_REFERENCE_PREVIEW;
  if (!source) return new Response(null, {status:404});
  try {
    return new Response(await readFile(source),{
      headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'},
    });
  } catch {
    return new Response(null,{status:404});
  }
}
