import Counter from './counter';
import verifyAuthorizationToken from './authentication';

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
  counterNamespace: DurableObjectNamespace<Counter>,
  authorizationToken: string,
  expectedAuthorizationTokenHash: string
) {
  const authorizationTokenValidity = await verifyAuthorizationToken(
    authorizationToken,
    expectedAuthorizationTokenHash
  );
  if (!authorizationTokenValidity) {
    return generateJSONResponse(
      { message: 'The request is not authorized.' },
      401
    );
  }

  const counterObjectStub = getCounterObjectStub(pathname, counterNamespace);
  await counterObjectStub.destroy();

  return generateJSONResponse({
    message: 'The counter is scheduled to be destroyed.',
  });
}

async function handleRequest(
  pathname: string,
  method: string,
  counterNamespace: DurableObjectNamespace<Counter>,
  authorizationToken: string,
  expectedAuthorizationTokenHash: string
) {
  switch (method) {
    case 'GET':
      return await handleGetRequest(pathname, counterNamespace);
    case 'DELETE':
      return await handleDeleteRequest(
        pathname,
        counterNamespace,
        authorizationToken,
        expectedAuthorizationTokenHash
      );
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
    const { COUNTER: COUNTER_NAMESPACE, DELETE_TOKEN_HASH } = env;

    const { url, method, headers } = request;
    const { pathname } = new URL(url);

    const authorizationToken = (headers.get('Authorization') ?? '').replace(
      'Bearer ',
      ''
    );

    try {
      return await handleRequest(
        pathname,
        method,
        COUNTER_NAMESPACE,
        authorizationToken,
        DELETE_TOKEN_HASH
      );
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
