import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

export const handler = middy(async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(
      event.authorizationToken
    )
    console.log('User was authorized', decodedToken)

    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    console.log('User was not authorized', e.message)

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
})

function verifyToken(authHeader: string): JwtToken {

  const cert = "-----BEGIN CERTIFICATE-----MIIDHTCCAgWgAwIBAgIJTGpVEngdVHLEMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNVBAMTIWRldi1seHRjZXFzd3BwdjI1a29uLnVzLmF1dGgwLmNvbTAeFw0yMjExMjUwODI1MjBaFw0zNjA4MDMwODI1MjBaMCwxKjAoBgNVBAMTIWRldi1seHRjZXFzd3BwdjI1a29uLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMemRjHk1c6zCmLN/61ESVkxciALY4UeshHYqu5PcME9kQJGMoTYL9VgAmiixWpcC4XtqGZKwM1cDUX3LEYYKsdtnB80QpCDQY3LUddateBEH9YAYonMGeXADULHpLT+c+Thvd7yAGYzjh7D4Fs0OCrZt/G/omXb7FqTnim3luP6BU/nkBl6tsQXmRMBzISLYdIy1c0azH3IxegzR1raI6dC4pSGMifdobGmN7N11NfkQG3XAtG6pDJKYvUrjsgoeQ85y1g37ZJuvl079fs8YIEcSmkHQej237rHr4jgbBviBWuUtWLbYERCGsLHEXOZ1KiUQ3hkOP0Emn8oVBRevcsCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUvKM9QrX2arOJ1EpyOrDFWuGg+YQwDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQBHCapPSHublzG+qziumCZv9fbyIPzK3+t0qoHzl9bLx33Vf7yLsMQ3mIB6fspYno7fz0eAqoyu7gBopkxo/DyRQ7d65ICIKrXYQUYV7pkn0EePVlNbNbbd/qmFHoMKCqyn2EZIsUgHaGNxzbeiCrvfbsGc/371vRBSQLfe6ognPQZWDxrHTPiSxm5vIXU/ktmbP+mOp0WYhVTT345qNmIBB/jONo0rYxXR3+8qITWqquI96Pcgw0iY2chPEH+z5LGr+PGisrSUGZIp5k2rZFClCCFKR0palqquZNty9zt7K30IJaruKAfaK52WaiP3WSh4pR/g3u/NVhSxqgHufOEX-----END CERTIFICATE-----"
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, {algorithms: ['RS256']}) as JwtToken
}
