// public/js/revision.js
// Wrapper for the Revision feature.
// Calls the /api/revision endpoint and returns the parsed JSON.

import { post } from './api.js';

/** Get revision pack for given notes. */
export async function revisionPack(notes) {
  if (typeof notes !== 'string' || notes.trim() === '') {
    throw new Error('Notes cannot be empty');
  }
  return await post('/api/revision', { notes });
}
