import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function allowPreflight(
  request: ZuploRequest,
  _context: ZuploContext,
): Promise<ZuploRequest> {
  if (request.method?.toUpperCase() === "OPTIONS") {
    return request;
  }

  // Non-OPTIONS traffic continues through the remaining inbound policies unchanged.
  return request;
}
