import type { Request, Response } from 'express';
import { Errors } from '../shared/errors';
import { success } from '../shared/http';
import * as agakayeService from '../services/agakaye.service';
import {
  createAgakayeSchema,
  listAgakayeQuerySchema,
  updateAgakayeSchema,
} from '../validators/agakaye.validator';

export async function listEntries(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const filters = listAgakayeQuerySchema.parse(req.query);
  return success(res, await agakayeService.listEntries(req.user.id, filters));
}

export async function createEntry(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = createAgakayeSchema.parse(req.body);
  const entry = await agakayeService.createEntry(req.user.id, input);
  return success(res, { entry }, 'Saved to Agakaye', 201);
}

export async function updateEntry(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  const input = updateAgakayeSchema.parse(req.body);
  const entry = await agakayeService.updateEntry(req.user.id, String(req.params.id), input);
  return success(res, { entry });
}

export async function deleteEntry(req: Request, res: Response) {
  if (!req.user) throw Errors.unauthorized();
  return success(res, await agakayeService.deleteEntry(req.user.id, String(req.params.id)));
}
