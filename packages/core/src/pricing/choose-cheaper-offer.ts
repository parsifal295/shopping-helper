type ComparableOffer = {
  store: "coupang" | "ssg";
  price: number;
  eligible: boolean;
};

export function chooseCheaperOffer(offers: ComparableOffer[]) {
  return (
    offers
      .filter((offer) => offer.eligible)
      .sort((left, right) => left.price - right.price)[0] ?? null
  );
}

export function buildNotifications(input: {
  previous: { store: "coupang" | "ssg"; price: number; isOnSale: boolean } | null;
  current: { store: "coupang" | "ssg"; price: number; isOnSale: boolean };
}) {
  const notifications: { type: "sale_started" | "price_dropped"; winningStore: "coupang" | "ssg" }[] = [];

  if (!input.previous) {
    return notifications;
  }

  if (!input.previous.isOnSale && input.current.isOnSale) {
    notifications.push({ type: "sale_started", winningStore: input.current.store });
  }

  if (input.current.price < input.previous.price) {
    notifications.push({ type: "price_dropped", winningStore: input.current.store });
  }

  return notifications;
}
