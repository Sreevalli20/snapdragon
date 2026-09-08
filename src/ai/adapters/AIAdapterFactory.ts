import { AIEngine } from '../interfaces/AIEngine';
import { AIRuntimeMode } from '../../types';
import { DevelopmentAIAdapter } from './DevelopmentAIAdapter';
import { LocalAIAdapter } from './LocalAIAdapter';
import { QualcommAIAdapter } from './QualcommAIAdapter';

export class AIAdapterFactory {
  private static developmentAdapter = new DevelopmentAIAdapter();
  private static localAdapter = new LocalAIAdapter();
  private static qualcommAdapter = new QualcommAIAdapter();

  static getAdapter(mode: AIRuntimeMode): AIEngine {
    switch (mode) {
      case 'development':
        return this.developmentAdapter;
      case 'local':
        return this.localAdapter;
      case 'qualcomm':
        return this.qualcommAdapter;
      default:
        return this.localAdapter;
    }
  }

  static getQualcommAdapter(): QualcommAIAdapter {
    return this.qualcommAdapter;
  }
}
