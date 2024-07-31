import Counter from './counter';

function generateJSONResponse(
  body: Record<string, unknown>,
  status = 200,
  additionalHeaders: Record<string, unknown> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}

function getCounterObjectStub(
  pathname: string,
  counterNamespace: DurableObjectNamespace<Counter>
) {
  const counterID: DurableObjectId = counterNamespace.idFromName(pathname);
  return counterNamespace.get(counterID);
}

async function handleGetRequest(
  pathname: string,
  counterNamespace: DurableObjectNamespace<Counter>
) {
  const counterObjectStub = getCounterObjectStub(pathname, counterNamespace);
  const newValue = await counterObjectStub.increment();

  return generateJSONResponse({ newValue });
}

async function handleDeleteRequest(
  pathname: string,
  counterNamespace: DurableObjectNamespace<Counter>
) {
  const counterObjectStub = getCounterObjectStub(pathname, counterNamespace);
  await counterObjectStub.destroy();

  return generateJSONResponse({
    message: 'The counter is scheduled to be destroyed.',
  });
}

async function handleRequest(
  pathname: string,
  method: string,
  counterNamespace: DurableObjectNamespace<Counter>
) {
  switch (method) {
    case 'GET':
      return await handleGetRequest(pathname, counterNamespace);
    case 'DELETE':
      return await handleDeleteRequest(pathname, counterNamespace);
    default:
      return generateJSONResponse(
        { message: 'The method used in this request is not supported.' },
        405,
        {
          Allow: 'GET, DELETE',
        }
      );
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const counterNamespace = env.COUNTER as DurableObjectNamespace<Counter>;

    const { url, method } = request;
    const { pathname } = new URL(url);

    try {
      return await handleRequest(pathname, method, counterNamespace);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('InvalidState')) {
        return generateJSONResponse({ message: error.message }, 400);
      }

      return generateJSONResponse(
        { message: 'Unknown internal server error occured.' },
        500
      );
    }
  },
} satisfies ExportedHandler<Env>;

export { Counter };
