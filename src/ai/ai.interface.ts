import { GitContext } from '../collectors/git.collector';

export interface PostGenerationOptions {
  context: GitContext;
  customNotes?: string;
  userInstruction?: string;
}

export interface AIProvider {
  isConfigured(): boolean;
  generateLinkedInPost(options: PostGenerationOptions): Promise<string>;
}
