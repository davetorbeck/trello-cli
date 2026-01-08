import { BaseCommand } from '../../BaseCommand';
import { Flags } from '@oclif/core';

export default class Show extends BaseCommand<typeof Show> {
  static description = 'Show card details';

  static flags = {
    card: Flags.string({ required: false, description: 'Card name (requires --board and --list)' }),
    board: Flags.string({ required: false, description: 'Board name' }),
    list: Flags.string({ required: false, description: 'List name' }),
    url: Flags.string({
      required: false,
      description: 'Trello card URL (e.g., https://trello.com/c/iOtoErm9/...)',
    }),
  };

  private parseCardUrl(url: string): string | null {
    const match = url.match(/trello\.com\/c\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async run(): Promise<void> {
    let cardId: string;

    if (this.flags.url) {
      const shortLink = this.parseCardUrl(this.flags.url);
      if (!shortLink) {
        throw new Error(`Invalid Trello card URL: ${this.flags.url}`);
      }
      cardId = shortLink;
    } else if (this.flags.card && this.flags.board && this.flags.list) {
      cardId = this.lookups.card;
    } else {
      throw new Error('Either --url or all of --board, --list, and --card are required');
    }

    const [card, actions, attachments] = await Promise.all([
      this.client.cards.getCard({
        id: cardId,
      }),
      this.client.cards.getCardActions({
        id: cardId,
        filter: 'commentCard',
      }),
      this.client.cards.getCardAttachments({
        id: cardId,
      }),
    ]);

    this.output({ card, actions, attachments });
  }

  protected async toData(data: { card: any; actions: any[]; attachments: any[] }) {
    const comments = data.actions.map((action: any) => ({
      id: action.id,
      text: action.data?.text || '',
      date: action.date,
      author: action.memberCreator?.fullName || action.memberCreator?.username || 'Unknown',
    }));

    const images = data.attachments
      .filter((att: any) => att.mimeType?.startsWith('image/'))
      .map((att: any) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        mimeType: att.mimeType,
      }));

    return {
      id: data.card.id,
      name: data.card.name,
      due: data.card.due,
      description: data.card.desc,
      labels: data.card.labels,
      url: data.card.url,
      members: await this.cache.convertMemberIdsToEntity(data.card.idMembers),
      comments,
      images,
    };
  }
}
