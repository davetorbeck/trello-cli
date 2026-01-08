import { BaseCommand } from '../../BaseCommand';
import { Flags } from '@oclif/core';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export default class DownloadAttachments extends BaseCommand<typeof DownloadAttachments> {
  static description = 'Download card attachments (images) to local directory';

  static flags = {
    card: Flags.string({ required: false, description: 'Card name (requires --board and --list)' }),
    board: Flags.string({ required: false, description: 'Board name' }),
    list: Flags.string({ required: false, description: 'List name' }),
    url: Flags.string({
      required: false,
      description: 'Trello card URL (e.g., https://trello.com/c/iOtoErm9/...)',
    }),
    output: Flags.string({
      char: 'o',
      required: false,
      default: '.',
      description: 'Output directory for downloaded files',
    }),
  };

  protected defaultOutput: string = 'json';

  private parseCardUrl(url: string): string | null {
    const match = url.match(/trello\.com\/c\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private async downloadWithOAuth(
    downloadUrl: string,
    outputPath: string,
    apiKey: string,
    token: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(downloadUrl);
      const options: https.RequestOptions = {
        hostname: 'api.trello.com',
        path: urlObj.pathname,
        method: 'GET',
        headers: {
          Authorization: `OAuth oauth_consumer_key="${apiKey}", oauth_token="${token}"`,
        },
      };

      https
        .get(options, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.followRedirect(redirectUrl, outputPath, resolve, reject);
              return;
            }
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: ${response.statusCode}`));
            return;
          }

          this.saveResponseToFile(response, outputPath, resolve, reject);
        })
        .on('error', reject);
    });
  }

  private followRedirect(
    redirectUrl: string,
    outputPath: string,
    resolve: () => void,
    reject: (err: Error) => void,
  ): void {
    https
      .get(redirectUrl, (redirectResponse) => {
        if (redirectResponse.statusCode !== 200) {
          reject(new Error(`Failed to download (redirect): ${redirectResponse.statusCode}`));
          return;
        }
        this.saveResponseToFile(redirectResponse, outputPath, resolve, reject);
      })
      .on('error', reject);
  }

  private saveResponseToFile(
    response: NodeJS.ReadableStream,
    outputPath: string,
    resolve: () => void,
    reject: (err: Error) => void,
  ): void {
    const fileStream = fs.createWriteStream(outputPath);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      resolve();
    });
    fileStream.on('error', reject);
  }

  private buildApiDownloadUrl(trelloUrl: string): string {
    return trelloUrl.replace('https://trello.com/', 'https://api.trello.com/');
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

    const outputDir = path.resolve(this.flags.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const attachments = await this.client.cards.getCardAttachments({
      id: cardId,
    });

    const images = attachments.filter((att: any) => att.mimeType?.startsWith('image/'));

    if (images.length === 0) {
      this.log('No image attachments found on this card.');
      return;
    }

    const apiKey = await this.trelloConfig.getApiKey();
    const token = await this.trelloConfig.getToken();

    const downloadedFiles: Array<{ name: string; path: string; url: string }> = [];

    for (const image of images) {
      const ext = this.getExtensionFromMimeType(image.mimeType);
      const fileName = this.sanitizeFileName(image.name || `attachment-${image.id}`) + ext;
      const filePath = path.join(outputDir, fileName);
      const apiUrl = this.buildApiDownloadUrl(image.url);

      try {
        this.log(`Downloading: ${image.name}...`);
        await this.downloadWithOAuth(apiUrl, filePath, apiKey, token);
        downloadedFiles.push({
          name: image.name,
          path: filePath,
          url: image.url,
        });
        this.log(`  Saved to: ${filePath}`);
      } catch (error: any) {
        this.warn(`Failed to download ${image.name}: ${error.message}`);
      }
    }

    this.log(`\nDownloaded ${downloadedFiles.length} of ${images.length} attachments.`);
    this.output(downloadedFiles);
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
    };
    return mimeToExt[mimeType] || '';
  }

  private sanitizeFileName(name: string): string {
    const nameWithoutExt = name.replace(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i, '');
    return nameWithoutExt.replace(/[/\\?%*:|"<>]/g, '-');
  }

  protected toData(data: Array<{ name: string; path: string; url: string }>) {
    return data;
  }
}
