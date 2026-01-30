export function computeInventoryState(events) {
  const stock = {}; // { itemId: { total, locations: {} } }

  events.forEach(event => {
    const {
      itemId,
      quantity,
      fromLocation,
      toLocation
    } = event;

    if (!stock[itemId]) {
      stock[itemId] = {
        total: 0,
        locations: {}
      };
    }

    // TOTAL STOCK
    stock[itemId].total += quantity;

    // FROM LOCATION (subtract)
    if (fromLocation) {
      stock[itemId].locations[fromLocation] =
        (stock[itemId].locations[fromLocation] || 0) - Math.abs(quantity);
    }

    // TO LOCATION (add)
    if (toLocation) {
      stock[itemId].locations[toLocation] =
        (stock[itemId].locations[toLocation] || 0) + Math.abs(quantity);
    }
  });

  return stock;
}
