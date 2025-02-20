import { ListOutputsResult } from '@bsv/sdk'
import { Setup } from '@bsv/wallet-toolbox'

/**
 * Run this function using the following command:
 *
 * ```bash
 * npx tsx src/listOutputs.ts
 * ```
 *
 * @publicbody
 */

/**
 * listOutputs using specific basket.
 *
 * Converts the destination identity key into its associated address and uses it to generate a locking script.
 *
 * Explicitly specifies the new output to be created as part of a new action (transaction).
 *
 * When outputs are explicitly added to an action, they must be funded:
 * - Typically, at least one "change" input will be automatically added to fund the transaction.
 * - At least one output will be added to recapture excess funding.
 *
 */

export async function listOutputs(): Promise<void> {
  const env = Setup.getEnv('test')
  const identityKey = env.identityKey
  const setup = await Setup.createWalletClient({
    env,
    rootKeyHex: env.devKeys[identityKey]
  })
  const rb = await setup.storage.findOutputBaskets({
    partial: { basketId: 98 }
  })
  console.log('rb:', rb)
  const ro: ListOutputsResult = await setup.wallet.listOutputs({
    //basket: 'default',
    basket: 'todotokens22',
    includeLabels: true,
    include: 'locking scripts',
    includeCustomInstructions: true
  })
  console.log('ro:', ro)
}

listOutputs().catch(console.error)
