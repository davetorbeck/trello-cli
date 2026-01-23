import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import * as chrono from "chrono-node";

export default class Update extends BaseCommand<typeof Update> {
  static description = "Update a card";

  static flags = {
    card: Flags.string({ required: true, description: "Card name or ID" }),
    board: Flags.string({ required: true, description: "Board name or ID" }),
    list: Flags.string({ required: true, description: "List name or ID" }),
    name: Flags.string({ char: "n", description: "New card name" }),
    description: Flags.string({
      char: "d",
      description: "Card description (use - to read from stdin)",
    }),
    due: Flags.string({ description: "Due date (natural language supported)" }),
    "clear-due": Flags.boolean({
      description: "Clear the due date",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const updates: Record<string, any> = {
      id: this.lookups.card,
    };

    if (this.flags.name) {
      updates.name = this.flags.name;
    }

    if (this.flags.description !== undefined) {
      let desc = this.flags.description;

      // Read from stdin if description is "-"
      if (desc === "-") {
        desc = await this.readStdin();
      }

      updates.desc = desc;
    }

    if (this.flags["clear-due"]) {
      updates.due = null;
    } else if (this.flags.due) {
      const parsed = chrono.parseDate(this.flags.due);
      updates.due = parsed ? parsed.toISOString() : null;
    }

    const card = await this.client.cards.updateCard(updates as any);

    this.output(card);
  }

  private async readStdin(): Promise<string> {
    return new Promise((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("readable", () => {
        let chunk;
        while ((chunk = process.stdin.read()) !== null) {
          data += chunk;
        }
      });
      process.stdin.on("end", () => {
        resolve(data.trim());
      });
    });
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      due: data.due,
      description: data.desc,
      labels: data.labels,
      url: data.url,
    };
  }
}
