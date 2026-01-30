// src/constants/eventTypes.js

export const EVENT_TYPES = {
  RECEIVE: {
    key: 'RECEIVE',
    label: 'Receive Stock',
    stockEffect: 'IN',          // increases stock
    requiresFrom: false,
    requiresTo: true,
    immutable: true,
  },

  MOVE: {
    key: 'MOVE',
    label: 'Move Stock',
    stockEffect: 'TRANSFER',    // out from one, in to another
    requiresFrom: true,
    requiresTo: true,
    immutable: true,
  },

  DELIVER: {
    key: 'DELIVER',
    label: 'Deliver to Customer',
    stockEffect: 'OUT',         // decreases stock
    requiresFrom: true,
    requiresTo: false,
    immutable: true,
  },

  RETURN: {
    key: 'RETURN',
    label: 'Return Stock',
    stockEffect: 'IN',          // increases stock
    requiresFrom: false,
    requiresTo: true,
    immutable: true,
  },
};
