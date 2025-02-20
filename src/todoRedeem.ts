import {
  HexString,
  ListOutputsResult,
  LockingScript,
  PushDrop,
  Transaction
} from '@bsv/sdk'
import { Setup } from '@bsv/wallet-toolbox'

/**
 * Run this function using the following command:
 *
 * ```bash
 * npx tsx src/todoRedeem.ts
 * ```
 *
 * @publicbody
 */

/**
 * Redeem the ToDo task token.
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

interface Task {
  task: string
  sats: number
  outpoint: string
  lockingScript: HexString
}

export async function toDo({ satoshis }: { satoshis: number }): Promise<void> {
  const env = Setup.getEnv('test')
  const identityKey = env.identityKey
  const setup = await Setup.createWalletClient({
    env,
    rootKeyHex: env.devKeys[identityKey]
  })
  // Here's the part where we create the new Bitcoin token.
  // This uses a library called PushDrop, which lets you attach data
  // payloads to Bitcoin token outputs.Then, you can redeem / unlock the
  // tokens later.
  //const TODO_PROTO_ADDR = '1ToDoDtKreEzbHYKFjmoBuduFmSXXUGZG'
  const rl: ListOutputsResult = await setup.wallet.listOutputs({
    //basket: 'default',
    basket: `todotokens${satoshis}`,
    includeLabels: true,
    include: 'locking scripts',
    includeCustomInstructions: true
  })
  console.log('rl:', rl)
  const output = rl.outputs[0]
  console.log('output:', output)
  const selectedTask: Task = {
    outpoint: output.outpoint,
    sats: output.satoshis,
    task: `test ToDo app ${satoshis}`,
    lockingScript: output.lockingScript!
  }
  const { signableTransaction } = await setup.wallet.createAction({
    description: 'Redeem the task token',
    // These are inputs, which unlock Bitcoin tokens.
    // The input comes from the previous ToDo token, which we're now
    // completing, redeeming and spending.
    inputs: [
      {
        // Spending descriptions tell the user why this input was redeemed
        inputDescription: 'Complete a ToDo list item',
        // The output we want to redeem is specified here
        outpoint: selectedTask.outpoint,
        // Provide a placeholder length for the unlocking script we will create and add later
        unlockingScriptLength: 73
      }
    ],
    options: {
      randomizeOutputs: false
    }
  })

  if (signableTransaction === undefined) {
    throw new Error('Failed to create signable transaction')
  }

  const tx = Transaction.fromBEEF(signableTransaction.tx)

  // Here, we're using the PushDrop library to unlcok / redeem the PushDrop
  // token that was previously created. By providing this information,
  // PushDrop can "unlock" and spend the token. When the token gets spent,
  // the user gets their bitcoins back, and the ToDo token is removed from
  // the list.
  const unlocker = new PushDrop(setup.wallet).unlock(
    // To unlock the token, we need to use the same "todo list" protocolID
    // and keyID as when we created the ToDo token before. Otherwise, the
    // key won't fit the lock and the Bitcoins won't come out.
    [0, 'todo list'],
    '1',
    'self',
    'all',
    false,
    // the amount of Bitcoins we are expecting to unlock when the puzzle gets solved.
    selectedTask.sats,
    // We also give PushDrop a copy of the locking puzzle ("script") that
    // we want to open, which is helpful in preparing to unlock it.
    LockingScript.fromHex(selectedTask.lockingScript)
  )

  const unlockingScript = await unlocker.sign(tx, 0)

  // Now, we're going to use the unlocking puzle that PushDrop has prepared
  // for us, so that the user can get their Bitcoins back.This is another
  // "Action", which is just a Bitcoin transaction. TODOMATT rewrite this section's comments
  await setup.wallet.signAction({
    reference: signableTransaction.reference,
    spends: {
      0: {
        unlockingScript: unlockingScript.toHex()
      }
    }
  })
}

toDo({ satoshis: 22 }).catch(console.error)
