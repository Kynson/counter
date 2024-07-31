function stringToArrayBuffer(string: string) {
  const stringLength = string.length;

  const result = new Uint8Array(stringLength);

  for (let i = 0; i < stringLength; i++) {
    result[i] = string.charCodeAt(i);
  }

  return result;
}

function base64StringToArrayBuffer(string: string) {
  const rawBinaryString = atob(string);
  return stringToArrayBuffer(rawBinaryString);
}

export default async function verifyAuthorizationToken(
  token: string,
  expectedHash: string
) {
  const tokenArrayBuffer = stringToArrayBuffer(token);
  const expectedHashArrayBuffer = base64StringToArrayBuffer(expectedHash);

  const tokenHash = await crypto.subtle.digest('SHA-512', tokenArrayBuffer);

  return crypto.subtle.timingSafeEqual(tokenHash, expectedHashArrayBuffer);
}
