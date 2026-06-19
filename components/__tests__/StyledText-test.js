import * as React from 'react';
import renderer from 'react-test-renderer';

import { MonoText } from '../StyledText';

it(`renders correctly`, async () => {
  let testRenderer;
  await renderer.act(async () => {
    testRenderer = renderer.create(<MonoText>Snapshot test!</MonoText>);
  });

  const tree = testRenderer.toJSON();

  expect(tree).toMatchSnapshot();
});
