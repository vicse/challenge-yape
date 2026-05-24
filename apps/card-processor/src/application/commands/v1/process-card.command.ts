export class ProcessCardCommand {
  constructor(
    public readonly cardId: string,
    public readonly requestId: string,
    public readonly forceError: boolean,
  ) {}
}
