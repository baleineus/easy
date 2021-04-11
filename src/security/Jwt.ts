import { decode, sign, verify } from 'jsonwebtoken';
import { Json, Value } from '../types';
import { rule } from '../validation';

export class Jwt extends Value {
  static sign = (token: Json): Jwt => new Jwt(sign(token, '734afd05-f5d7-4053-a110-d09d0cb86cf4', { expiresIn: '1h' }));

  static of = (a: { jwt: string }): Jwt => new Jwt(a.jwt);

  decode = (): Json => decode(this.value) as Json;

  @rule('Token is not valid')
  verify(): boolean {
    try {
      verify(this.value, 'secret');
      return true;
    } catch (e) {
      return false;
    }
  }

  toJSON(): Json {
    return { jwt: this.value };
  }
}
