import request from 'supertest';
import { app } from '../index';

export function getTestApp() {
  return request(app);
}

