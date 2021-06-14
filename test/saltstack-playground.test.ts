import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SaltstackPlayground from '../lib/saltstack-playground-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SaltstackPlayground.SaltstackPlaygroundStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
