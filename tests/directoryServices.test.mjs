import test from 'node:test';
import assert from 'node:assert/strict';
import { directoryServices } from '../services/marketplace/directoryServices.js';

test('directory groups trade variants and specialties', () => {
  for (const [label, group] of [
    ['Automotive Mechanic', 'Mechanics'], ['mechanics', 'Mechanics'],
    [' Specialist Plumber ', 'Plumbing'], ['Plumbers and Projects', 'Plumbing'],
    ['Master Electrician', 'Electrical'], ['electrical services', 'Electrical'],
    ['Cleaning Services', 'Cleaning'], ['Cleaner, household', 'Cleaning'],
    ['Crèche', 'Day Care'], ['Event Caterer', 'Catering'], ['Builders', 'Building'],
  ]) assert.deepEqual(directoryServices(label), [group]);
});

test('each listed trade is discoverable once and compound names survive', () => {
  assert.deepEqual(directoryServices('General Contractor, Builders, Plumbing, Plumber, Electrician'),
    ['General Contractor', 'Building', 'Plumbing', 'Electrical']);
  assert.deepEqual(directoryServices('Cleaner, household / Painter & Carpenter'),
    ['Cleaning', 'Painting', 'Carpentry']);
  assert.deepEqual(directoryServices('Glass and Aluminium;Linen & Curtains|Art & Design'),
    ['Glass and Aluminium', 'Linen & Curtains', 'Art & Design']);
  assert.deepEqual(directoryServices(null), []);
});
