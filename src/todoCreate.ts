import { PushDrop, Utils, WalletProtocol } from '@bsv/sdk'
import { Setup } from '@bsv/wallet-toolbox'

/**
 * Run this function using the following command:
 *
 * ```bash
 * npx tsx src/todoCreate.ts
 * ```
 *
 * @publicbody
 */

/**
 * Creates the ToDo task token.
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
  const TODO_PROTO_ADDR = '1ToDoDtKreEzbHYKFjmoBuduFmSXXUGZG'
  const pushdrop = new PushDrop(setup.wallet)
  const bitcoinOutputScript = await pushdrop.lock(
    [
      // The "fields" are the data payload to attach to the token.
      // For more info on these fields, look at the ToDo protocol document
      // (PROTOCOL.md). Note that the PushDrop library handles the public
      // key, signature, and OP_DROP fields automatically.
      Utils.toArray(TODO_PROTO_ADDR, 'utf8') as number[] // TODO protocol namespace address TODOMATT remove the as number[] after updated sdk
      //encryptedTask // TODO task (encrypted)
    ],
    // The same "todo list" protocol and key ID can be used to sign and
    // lock this new Bitcoin PushDrop token.
    [0, 'todo list'],
    '1',
    'self'
  )

  // Now that we have the output script for our ToDo Bitcoin token, we can
  // add it to a Bitcoin transaction (a.k.a. "Action"), and register the
  // new token with the blockchain. On the MetaNet, Actions are anything
  // that a user does, and all Actions take the form of Bitcoin
  // transactions.
  const createTask = `test ToDo app ${satoshis}`
  const newToDoToken = await setup.wallet.createAction({
    // This Bitcoin transaction ("Action" with a capital A) has one output,
    // because it has led to the creation of a new Bitcoin token. The token
    // that gets created represents our new ToDo list item.
    outputs: [
      {
        // The output script for this token was created by PushDrop library,
        // which you can see above.
        lockingScript: bitcoinOutputScript.toHex(),
        // The output amount is how much Bitcoin (measured in "satoshis")
        // this token is worth. We use the value that the user entered in the
        // dialog box.
        satoshis,
        // We can put the new output into a "basket" which will keep track of
        // it, so that we can get it back later.
        basket: `todotokens${satoshis}`,
        // Lastly, we should describe this output for the user.
        outputDescription: 'New ToDo list item'
      }
    ],
    options: {
      randomizeOutputs: false
    },
    // Describe the Actions that your app facilitates, in the present
    // tense, for the user's future reference.
    description: `${createTask}`
  })
}

toDo({ satoshis: 22 }).catch(console.error)
