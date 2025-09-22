import React from 'react';
import { render } from '@testing-library/react';
import { MissionControlProvider } from '@/state/MissionControlState';

describe('MissionControlProvider', () => {
  it('renders children without crashing', () => {
    const { getByText } = render(
      <MissionControlProvider>
        <div>child</div>
      </MissionControlProvider>,
    );
    expect(getByText('child')).toBeTruthy();
  });
});
