export type CollectionErrorCode = "auth_required" | "parse_failed" | "request_failed";

export class CollectionError extends Error {
  code: CollectionErrorCode;

  constructor(code: CollectionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CollectionError";
  }
}
