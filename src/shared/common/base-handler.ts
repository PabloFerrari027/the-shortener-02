export abstract class BaseHandler {
  abstract execute(input?: unknown): Promise<unknown>;
}
