import config from '../../config.js'
import gql from 'graphql-tag'
import { NetworksAll } from '../popup/gql'
import { lunieMessageTypes, parseTx } from '../scripts/parsers'
import { storeWallet } from '@lunie/cosmos-keys'

export default ({ apollo }) => {
  const createSeed = async () => {
    const { getSeed } = await import('@lunie/cosmos-keys')
    return getSeed()
  }

  const preloadNetworkCapabilities = async ({ commit }) => {
    const networks = [
      { id: 'mainnet', chain_id: 'wns-mainnet', network_type: 'cosmos', address_prefix: 'cosmos', testnet: false, title: 'Wireline Mainnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'mainnet', default: false },
      { id: 'halo', chain_id: 'halo', network_type: 'halo', testnet: false, title: 'DXOS.org HALO', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'halo', default: false },
      { id: 'moon', chain_id: 'moon', network_type: 'cosmos', address_prefix: 'cosmos', curves : '[{"value": "ed25519", "name": "Edwards curve"}]', defaultCurve: 'ed25519', testnet: true, title: 'Moon Devnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'moon', default: true, HDPaths: '[{ "value": "m/44\'/118\'/0\'/0/0", "name": "Moon HD Path" }]', defaultHDPath: "m/44'/118'/0'/0/0" },
      { id: 'phobos', chain_id: 'phobos', network_type: 'cosmos', testnet: true, title: 'Phobos Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'phobos', default: false },
      { id: 'mars', chain_id: 'mars', network_type: 'cosmos', testnet: true, title: 'Mars Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'mars', default: false },
      { id: 'mercury', chain_id: 'mercury', network_type: 'cosmos', testnet: true, title: 'Mercury Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'mercury', default: false },
      { id: 'venus', chain_id: 'venus', network_type: 'cosmos', testnet: true, title: 'Venus Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'venus', default: false }
    ]
    commit('setNetworks', networks)
  }

  const setNetwork = ({ commit }, network) => {
    commit('setNetworkId', network.id)
  }

  const getWalletFromSandbox = async (
    seedPhrase,
    networkObject,
    HDPath,
    curve
  ) => {
    return new Promise((resolve) => {
      var iframe = document.getElementById('sandboxFrame')
      window.addEventListener(
        'message',
        function (event) {
          resolve(event.data)
        },
        { once: true }
      )
      var message = {
        type: 'getWallet',
        seedPhrase,
        networkObject,
        HDPath,
        curve
      }
      iframe.contentWindow.postMessage(message, '*')
    })
  }

  const createKey = async (
    store,
    { seedPhrase, password, name, HDPath, curve, network }
  ) => {
    const networkObject = store.getters.networks.find(
      ({ id }) => id === network
    )
    const { result: wallet } = await getWalletFromSandbox(
      seedPhrase,
      networkObject,
      HDPath,
      curve
    )
    storeWallet(wallet, name, password, network, HDPath, curve)
    store.dispatch('loadLocalAccounts')
  }

  const loadLocalAccounts = ({ commit }) => {
    chrome.runtime.sendMessage(
      {
        type: 'GET_WALLETS'
      },
      function (response) {
        commit('setAccounts', response || [])
      }
    )
  }

  const getWallet = (store, { address, password }) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'GET_WALLET',
          payload: { address, password }
        },
        function (wallet) {
          if (!wallet) return reject('Could not get wallet')
          return resolve(wallet)
        }
      )
    })
  }

  const testLogin = (store, { address, password }) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'TEST_PASSWORD',
          payload: { address, password }
        },
        function (response) {
          resolve(response)
        }
      )
    })
  }

  const getSignRequest = ({ commit }) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'GET_SIGN_REQUEST'
        },
        function (response) {
          commit('setSignRequest', response)
          resolve(response)
        }
      )
    })
  }

  const getValidatorsData = async (lunieTx, network) => {
    let validators = []
    if (
      lunieTx.type === lunieMessageTypes.STAKE ||
      lunieTx.type === lunieMessageTypes.RESTAKE
    ) {
      validators.push(...lunieTx.details.to)
    }
    if (
      lunieTx.type === lunieMessageTypes.UNSTAKE ||
      lunieTx.type === lunieMessageTypes.RESTAKE ||
      lunieTx.type === lunieMessageTypes.CLAIM_REWARDS
    ) {
      validators.push(...lunieTx.details.from)
    }
    return await Promise.all(
      validators.map(async (validatorAddress) => {
        const { name: validatorToMoniker, picture } = await fetchValidatorData(
          validatorAddress,
          network
        )
        return {
          operatorAddress: validatorAddress,
          name: validatorToMoniker,
          picture
        }
      })
    )
  }

  const fetchValidatorData = async (validatorAddress, network) => {
    return fetch(`${config.graphqlHost}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: `{"query": "query{validator(operatorAddress: \\"${validatorAddress}\\", networkId: \\"${network}\\"){ name picture }}"}`
    })
      .then(async function (response) {
        const validatorObject = await response.json()
        return {
          name: validatorObject.data.validator.name,
          picture: validatorObject.data.validator.picture
        }
      })
      .catch(function (error) {
        console.log('Error: ', error)
      })
  }

  const approveSignRequest = (
    { commit, getters },
    {
      senderAddress,
      password,
      id,
      messageType,
      message,
      transactionData,
      network,
      HDPath,
      curve
    }
  ) => {
    console.log('Here approveSignRequest')
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'SIGN',
          payload: {
            messageType,
            message,
            transactionData,
            senderAddress,
            password,
            id,
            network: getters.networks.find(({ id }) => id === network),
            HDPath,
            curve
          }
        },
        function (response) {
          if (response && response.error) {
            console.log('Rejecting')
            return reject(response.error)
          }
          resolve()
          commit('setSignRequest', null)
        }
      )
    })
  }

  const getNetworkByAddress = async (store, address) => {
    const { data } = await apollo.query({
      query: gql`
        query Networks {
          networks {
            testnet
            id
            address_prefix
          }
        }
      `,
      fetchPolicy: 'cache-first'
    })
    const network = data.networks
      .filter((network) => address.indexOf(network.address_prefix) == 0)
      .sort((a) => a.testnet)
      .shift()
    return network ? network.id : ''
  }

  const rejectSignRequest = ({ commit }, signRequest) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'REJECT_SIGN_REQUEST',
          payload: signRequest
        },
        function (_response) {
          resolve()
          commit('setSignRequest', null)
        }
      )
    })
  }

  const signIn = () => {}

  const resetSignUpData = ({ commit }) => {
    commit(`resetSignUpData`)
  }

  const resetRecoverData = ({ commit }) => {
    commit(`resetRecoverData`)
  }

  const getAddressFromSeed = async (store, { seedPhrase, network }) => {
    const networkObject = store.getters.networks.find(
      ({ id }) => id === network
    )
    const { result: wallet } = await getWalletFromSandbox(
      seedPhrase,
      networkObject
    )

    // const wallet = await getWallet(seedPhrase, networkObject)
    return wallet.cosmosAddress
  }

  return {
    createSeed,
    createKey,
    loadLocalAccounts,
    getWallet,
    getNetworkByAddress,
    testLogin,
    getSignRequest,
    getValidatorsData,
    approveSignRequest,
    rejectSignRequest,
    signIn,
    resetSignUpData,
    resetRecoverData,
    getAddressFromSeed,
    setNetwork,
    preloadNetworkCapabilities,
    parseTx
  }
}
