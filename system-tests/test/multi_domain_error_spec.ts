import path from 'path'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/multi_domain_secondary.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `multi_domain_secondary.html`))
  })
}

describe('e2e multi domain errors', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
  })

  systemTests.it('captures the stack trace correctly for multi-domain errors to point users to their "cy.origin" callback', {
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'multi_domain_error_spec.ts',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      experimentalMultiDomain: true,
      experimentalSessionSupport: true,
    },
    async onRun (exec) {
      const res = await exec()

      expect(res.stdout).to.contain('AssertionError')
      expect(res.stdout).to.contain('Timed out retrying after 1000ms: Expected to find element: `#doesnotexist`, but never found it.')

      // check to make sure the snapshot contains the 'cy.origin' sourcemap. TODO: This is probably more appropriate for a cy-in-cy test
      expect(res.stdout).to.contain('http://localhost:3500/__cypress/tests?p=cypress/integration/multi_domain_error_spec.ts:103:12')
    },
  })
})