export abstract class BasePresentation<I, O> {
  abstract toController(input: I): Promise<O>;
}
