import { Command } from "@oclif/core";

export default class Baran extends Command {
  static description = "Baran ingress commands.";
  static strict = false;
  static summary = "Baran ingress commands.";

  async run(): Promise<void> {
    this.parsed = true;
    if (this.argv.length === 0 || this.argv.includes("--help") || this.argv.includes("-h")) {
      printSwitchboardRootHelp(this.config.bin);
      return;
    }

    console.error(
      `[baran] Error (SB_COMMAND_NOT_NATIVE): unknown native proof baran command: ${this.argv.join(" ")}. ` +
        `Run \`${this.config.bin} baran --help\` to list native commands.`
    );
    this.exit(1);
  }
}

function printSwitchboardRootHelp(bin: string): void {
  console.log(`Baran ingress commands.

USAGE
  $ ${bin} baran <command> [options]

COMMANDS
  init
  project init|show
  context add|current|list|set|use
  context dns set|clear
  preflight
  deploy
  deploy doctor|resume|status
  launch-demo
  status
  claim|claimable|refund|refundable
  session register|status|refund|refundable
  hostname add|remove|status
  validator launch|script
  catalog build|inspect|set-state|verify
  gateway discover|setup|status|upgrade
  relay backfill-specs|budget|diff|keygen|list|logs|pick-processor|scaffold|status|sync|verify|watch|whoami
  relay catalog build|set-state
  relay dns apply|plan|remove|verify
  bootstrap
  ops

DESCRIPTION
  All listed commands use native proof baran entrypoints backed by
  local proof-cli-switchboard runners. The standalone baran
  compatibility bridge has been removed.`);
}
