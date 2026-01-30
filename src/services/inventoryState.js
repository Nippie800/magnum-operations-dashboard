export function computeInventoryState(events) {
  const state = {};

  for (const e of events) {
    const {
      itemId,
      type,
      quantity,
      fromLocation,
      toLocation,
    } = e;

    const qty = Number(quantity);

    if (!state[itemId]) {
      state[itemId] = {
        total: 0,
        onRoad: 0,
        locations: {},
      };
    }

    const item = state[itemId];

    const add = (loc, val) => {
      if (!loc) return;
      if (!item.locations[loc]) item.locations[loc] = 0;
      item.locations[loc] += val;
    };

    switch (type) {
      case "RECEIVE":
        item.total += qty;
        add(toLocation, qty);
        break;

      case "MOVE":
        add(fromLocation, -qty);
        add(toLocation, qty);
        break;

      case "DELIVER":
        item.total -= qty;
        item.onRoad += qty;
        add(fromLocation, -qty);
        break;

      case "RETURN":
        item.total += qty;
        item.onRoad -= qty;
        add(toLocation, qty);
        break;

      default:
        break;
    }
  }

  return state;
}
