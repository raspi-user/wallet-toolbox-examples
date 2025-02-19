import { AbortActionArgs, PushDrop, WalletProtocol } from '@bsv/sdk'
import { Setup } from '@bsv/wallet-toolbox'

/**
 * Run this function using the following command:
 *
 * ```bash
 * npx tsx src/abortAction.ts
 * ```
 *
 * @publicbody
 */

/**
 * Creates a new action but does not broadcast the transaction by setting `noSend` to `true`.
 * This simulates the scenario where we do not have a reference to pass to the `abortAction` method,
 * allowing us to pass the `txid` instead.
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
export async function abortAction(): Promise<void> {
  const env = Setup.getEnv('test')
  const identityKey = env.identityKey2
  const setup = await Setup.createWalletClient({
    env,
    rootKeyHex: env.devKeys[identityKey]
  })

  const t = new PushDrop(setup.wallet)
  const protocol: WalletProtocol = [2, 'abortactionexample']
  const keyId: string = '7'

  const lock = await t.lock(
    [
      [1, 2, 3],
      [4, 5, 6]
    ],
    protocol,
    keyId,
    identityKey,
    false,
    true,
    'before'
  )
  const lockingScript = lock.toHex()
  const satoshis = 13
  const label = `abort action`

  // Create the transaction but do NOT broadcast it by setting `noSend` to `true`.
  // The default value for `noSend` is `false`.
  const car = await setup.wallet.createAction({
    outputs: [
      {
        lockingScript,
        satoshis,
        outputDescription: label,
        tags: ['abort action'],
        customInstructions: JSON.stringify({
          protocol,
          keyId,
          counterparty: identityKey,
          type: 'abortAction'
        })
      }
    ],
    options: {
      randomizeOutputs: false,
      noSend: true
    },
    labels: [label],
    description: label
  })

  // Attempt to abort the action using the `txid` as the reference
  const args: AbortActionArgs = { reference: car.txid! }
  const r = await setup.wallet.abortAction(args)

  console.log('Abort action result:', JSON.stringify(r, null, 2))
}

abortAction().catch(console.error)
