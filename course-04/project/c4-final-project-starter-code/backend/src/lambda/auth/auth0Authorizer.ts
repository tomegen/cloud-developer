import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-lxtceqswppv25kon.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
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
    logger.error('User not authorized', { error: e.message })

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
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  logger.info("JWT: ", jwt)

  const request = await Axios.get(jwksUrl)
  const jwks = request.data

  logger.info("JWKS: ", jwks)
  const keys: any[] = jwks.keys

  const signingKey = keys.find(key => key.kid === jwt.header.kid)

  logger.info("signingKey: " + signingKey)

  let certValue:string = signingKey.x5c[0]

  logger.info("certValue: " + certValue)
  
  certValue = certValue.match(/.{1,64}/g).join('\n')
  const finalCertKey:string = '-----BEGIN CERTIFICATE-----\n'+ certValue +'\n-----END CERTIFICATE-----\n'

  logger.info("certValue new: " + certValue)

  let jwtPayload:JwtPayload = verify(token, finalCertKey, { algorithms: ['RS256'] }) as JwtPayload;

  logger.info("jwtPayload: " + jwtPayload)

  return jwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
