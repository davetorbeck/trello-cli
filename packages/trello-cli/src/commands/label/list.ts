import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class LabelList extends BaseCommand<typeof LabelList> {
  static description = "List all labels on a board";

  protected defaultOutput: string = "fancy";

  static flags = {
    board: Flags.string({ required: true, description: "Board name or ID" }),
  };

  async run(): Promise<void> {
    const labels = await this.client.boards.getBoardLabels({
      id: this.lookups.board,
    });
    this.output(labels);
  }

  protected toData(data: any) {
    return data.map((d: any) => {
      return {
        id: d.id,
        name: d.name,
        color: d.color,
      };
    });
  }

  protected format(data: any): Promise<string> {
    if (data.length === 0) {
      return Promise.resolve("No labels found on this board");
    }

    return Promise.resolve(
      data
        .map((label: any) => {
          const colorBadge = label.color ? `[${label.color}]` : "[no color]";
          const name = label.name || "(unnamed)";
          return `${colorBadge} ${name} (ID: ${label.id})`;
        })
        .join("\n")
    );
  }
}
