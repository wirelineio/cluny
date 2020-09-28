// adds the signature object to the tx
function createSignedTransactionObject(tx, signature) {
  return Object.assign({}, tx, {
    signatures: [signature],
  })
}

// attaches the request meta data to the message
function createStdTx({ gasEstimate, fee, memo }, messages) {
  console.log(`createStdTx ${gasEstimate}, ${fee}, ${memo}`)
  const fees = fee
    .map(({ amount, denom }) => ({
      amount: String(Math.round(amount)),
      denom,
    }))
    .filter(({ amount }) => amount > 0)
  return {
    msg: Array.isArray(messages) ? messages : [messages],
    fee: {
      amount: fees.length > 0 ? fees : null,
      gas: gasEstimate,
    },
    signatures: null,
    memo,
  }
}

/*
The SDK expects a certain message format to serialize and then sign.

type StdSignMsg struct {
  ChainID       string      `json:"chain_id"`
  AccountNumber uint64      `json:"account_number"`
  Sequence      uint64      `json:"sequence"`
  Fee           auth.StdFee `json:"fee"`
  Msgs          []sdk.Msg   `json:"msgs"`
  Memo          string      `json:"memo"`
}
*/
function createSignMessage(
  jsonTx,
  { accountSequence, accountNumber, chainId }
) {
  // sign bytes need amount to be an array
  const fee = {
    amount: jsonTx.fee.amount || [],
    gas: jsonTx.fee.gas,
  }

  return JSON.stringify(
    removeEmptyProperties({
      fee,
      memo: jsonTx.memo,
      msgs: jsonTx.msg, // weird msg vs. msgs
      sequence: String(accountSequence),
      account_number: String(accountNumber),
      chain_id: chainId,
    })
  )
}

function formatSignature(signature, accountSequence, accountNumber, publicKey) {
  return {
    signature: signature.toString(`base64`),
    account_number: accountNumber,
    sequence: accountSequence,
    pub_key: {
      type: `tendermint/PubKeySecp256k1`, // TODO: allow other keytypes
      value: publicKey.toString(`base64`),
    },
  }
}

function removeEmptyProperties(jsonTx) {
  if (Array.isArray(jsonTx)) {
    return jsonTx.map(removeEmptyProperties)
  }

  // string or number
  if (typeof jsonTx !== `object`) {
    return jsonTx
  }

  const sorted = {}
  Object.keys(jsonTx)
    .sort()
    .forEach((key) => {
      if (jsonTx[key] === undefined || jsonTx[key] === null) return

      sorted[key] = removeEmptyProperties(jsonTx[key])
    })
  return sorted
}

export async function getSignableObject(
  chainMessages,
  { gasEstimate, fee, memo = ``, chainId, accountNumber, accountSequence }
) {
  console.log("Here getSignableObject1")
  // sign transaction
  const stdTx = createStdTx({ gasEstimate, fee, memo }, chainMessages)
  console.log("Here getSignableObject2")
  const signMessage = createSignMessage(stdTx, {
    accountSequence,
    accountNumber,
    chainId,
  })
  console.log("Here getSignableObject3")
  return signMessage
}

export async function getBroadcastableObject(
  chainMessages,
  { accountSequence, accountNumber, gasEstimate, fee, memo },
  { signature, publicKey }
) {
  const stdTx = createStdTx({ gasEstimate, fee, memo }, chainMessages)
  const signatureObject = formatSignature(
    Buffer.from(signature, "hex"),
    accountSequence,
    accountNumber,
    Buffer.from(publicKey, "hex")
  )
  const signedTx = createSignedTransactionObject(stdTx, signatureObject)

  return signedTx
}
