import type { KillchainBlock, ScenarioBlock, ScenarioPosition } from './types';

export function getNextPosition(blocks: ScenarioBlock[], position: ScenarioPosition): ScenarioPosition | null {
  if (blocks.length === 0) {
    return null;
  }

  const block = blocks[position.blockIndex];

  if (block?.type === 'killchain' && position.killchainStepIndex < block.steps.length - 1) {
    return {
      blockIndex: position.blockIndex,
      killchainStepIndex: position.killchainStepIndex + 1,
    };
  }

  if (position.blockIndex < blocks.length - 1) {
    return {
      blockIndex: position.blockIndex + 1,
      killchainStepIndex: 0,
    };
  }

  return {
    blockIndex: 0,
    killchainStepIndex: 0,
  };
}

export function getPreviousPosition(blocks: ScenarioBlock[], position: ScenarioPosition): ScenarioPosition | null {
  if (position.blockIndex === 0 && position.killchainStepIndex === 0) {
    return null;
  }

  if (position.killchainStepIndex > 0) {
    return {
      blockIndex: position.blockIndex,
      killchainStepIndex: position.killchainStepIndex - 1,
    };
  }

  const previousBlockIndex = position.blockIndex - 1;
  const previousBlock = blocks[previousBlockIndex];

  return {
    blockIndex: previousBlockIndex,
    killchainStepIndex: getLastStepIndex(previousBlock),
  };
}

export function getLastStepIndex(block?: ScenarioBlock): number {
  return block?.type === 'killchain' ? block.steps.length - 1 : 0;
}

export function getPositionLabel(block: ScenarioBlock, position: ScenarioPosition): string {
  if (block.type !== 'killchain') {
    return `${position.blockIndex + 1}`;
  }

  return `${position.blockIndex + 1}.${position.killchainStepIndex + 1}`;
}

export function getKillchainStep(block: KillchainBlock, position: ScenarioPosition) {
  return block.steps[position.killchainStepIndex] ?? block.steps[0];
}
