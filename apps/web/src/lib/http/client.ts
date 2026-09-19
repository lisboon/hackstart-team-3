export class HttpError extends Error {
  readonly status: number;
  constructor(status: number) {
    const messages: Record<number, string> = {
      401: "Credenciais inválidas ou sessão expirada.",
      403: "Você não tem permissão para esta ação.",
      409: "Já existe um cadastro com esses dados.",
      422: "Confira os dados informados.",
      429: "Muitas solicitações. Aguarde antes de tentar novamente.",
    };
    super(messages[status] ?? "O serviço está indisponível. Tente novamente.");
    this.status = status;
  }
}

export async function request(
  path: string,
  options: RequestInit,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(API_URL + path, options);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error("Não foi possível conectar ao serviço.");
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new HttpError(response.status);
  }
  return response;
}

export async function requestJson(
  path: string,
  options: RequestInit,
): Promise<unknown> {
  const response = await request(path, options);
  try {
    return await response.json();
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error("O serviço retornou uma resposta inválida.");
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
