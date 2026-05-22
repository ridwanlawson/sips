import { describe, it, expect } from 'vitest';
import { centerHeaderStyle } from './tableHelper';

describe('tableHelper', () => {
  it('exports centerHeaderStyle with centered header cells', () => {
    expect(centerHeaderStyle).toHaveProperty('headCells');
    expect(centerHeaderStyle.headCells).toHaveProperty('style');
    expect(centerHeaderStyle.headCells?.style?.justifyContent).toBe('center');
  });
});
