type CollectionLogInput = {
  watchlistItemId: string;
  store: "coupang" | "ssg";
  status: "success" | "error";
  errorCode?: string;
};

export function logCollectionEvent(input: CollectionLogInput) {
  console.info("collection_event", JSON.stringify(input));
}
