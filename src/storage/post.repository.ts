import fs from 'fs';
import path from 'path';

export class PostRepository {
  private storageDir: string;

  constructor(customStorageDir?: string) {
    this.storageDir = customStorageDir || path.join(process.cwd(), '.posts');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public savePost(postContent: string, repoName: string): string {
    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 16);
    const safeRepoName = repoName.replace(/[/\\?%*:|"<>]/g, '-').replace(/\[|\]/g, '');
    const filename = `post_${safeRepoName}_${dateStr}.md`;
    const filePath = path.join(this.storageDir, filename);

    const fileContent = `---
date: ${now.toISOString()}
repository: ${repoName}
---

${postContent}
`;

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    return filePath;
  }
}
