// Shared in-process runner wrapper for the PROOF Ingress parachain oclif
// command files (lease/renew/retire/route). Mirrors the per-command boilerplate
// used by the Hub commands, factored out so the thin command files stay small.

export type IngressRunner = (argv?: readonly string[]) => Promise<void>;

export async function runIngressNative(
  runner: IngressRunner | undefined,
  argv: readonly string[],
  runnerName: string
): Promise<number> {
  if (!runner) {
    console.error(`[switchboard] Error: internal proof switchboard runner ${runnerName} is unavailable.`);
    return 1;
  }
  try {
    await runner(argv);
    return typeof process.exitCode === "number" ? process.exitCode : 0;
  } catch (error) {
    if (!ingressOutputHandled(error)) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[switchboard] ${message}`);
    }
    return 1;
  }
}

function ingressOutputHandled(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && (error as { switchboardOutputHandled?: boolean }).switchboardOutputHandled
  );
}
