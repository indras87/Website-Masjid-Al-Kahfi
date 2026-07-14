type RouteCtx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx?: RouteCtx) => Promise<Response>;

const BASE = 'http://localhost/api';

type CallOpts = {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  /** Raw RequestInit body (e.g. FormData) — bypasses JSON body construction. */
  rawBody?: BodyInit;
  headers?: Record<string, string>;
};

/** Invoke a Next.js route handler directly with a synthetic Request and parse its JSON response. */
export async function call(handler: Handler, opts: CallOpts = {}): Promise<{ status: number; body: any; raw: string; res: Response }> {
  const { method = 'GET', body, params, rawBody, headers = {} } = opts;
  const init: RequestInit = { method, headers: { ...headers } };

  if (rawBody !== undefined) {
    init.body = rawBody;
  } else if (body !== undefined) {
    (init.headers as Record<string, string>)['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const url = params ? `${BASE}/x/${Object.values(params).join('/')}` : `${BASE}/x`;
  const req = new Request(url, init);
  const ctx: RouteCtx | undefined = params ? { params: Promise.resolve(params) } : undefined;

  const res = await handler(req, ctx);
  const text = await res.text();
  let parsed: any;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  return { status: res.status, body: parsed, raw: text, res };
}
