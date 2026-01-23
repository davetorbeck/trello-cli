import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

const COLORS = [
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "blue",
  "sky",
  "lime",
  "pink",
  "black",
] as const;

export default class LabelCreate extends BaseCommand<typeof LabelCreate> {
  static description = "Create a label on a board";

  protected defaultOutput = "fancy";

  static flags = {
    board: Flags.string({ required: true, description: "Board name or ID" }),
    name: Flags.string({ char: "n", required: true, description: "Label name" }),
    color: Flags.enum({
      char: "c",
      options: [...COLORS],
      description: "Label color",
    }),
  };

  async run(): Promise<void> {
    const label = await this.client.boards.createBoardLabel({
      id: this.lookups.board,
      name: this.flags.name,
      color: this.flags.color,
    } as Parameters<typeof this.client.boards.createBoardLabel>[0]);

    this.output(label);
  }

  protected toData(data: { id: string; name: string; color: string }) {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  }

  protected format(data: { id: string; name: string; color: string }): Promise<string> {
    const colorBadge = data.color ? `[${data.color}]` : "[no color]";
    return Promise.resolve(`Created: ${colorBadge} ${data.name} (ID: ${data.id})`);
  }
}
