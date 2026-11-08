export type ApiErrorBody = { error: string };

export async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
