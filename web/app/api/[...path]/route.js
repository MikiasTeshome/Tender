import { database } from '../../../../lib/db.mjs';
import { handle } from '../../../../lib/api.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function route(request, {params}) {
  const {path} = await params;
  try {
    return await handle(database(),request,path);
  } catch {
    return Response.json({error:'The listing database is being configured.'},{status:503});
  }
}

export {route as GET,route as POST,route as PUT,route as DELETE};

