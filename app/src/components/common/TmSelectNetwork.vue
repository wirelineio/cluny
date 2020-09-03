<template>
  <SessionFrame>
    <div class="select-network">
      <h2 class="session-title">Select a Network</h2>

      <NetworkList :networks="mainNetworks" section-title="Main Networks" />
      <NetworkList :networks="testNetworks" section-title="Test Networks" />
    </div>
  </SessionFrame>
</template>

<script>
import NetworkList from "../network/NetworkList"
import SessionFrame from "common/SessionFrame"
import { mapGetters } from "vuex"

export default {
  name: `select-network`,
  components: {
    SessionFrame,
    NetworkList,
  },
  data: () => ({
    sortedNetworks: [],
  }),
  computed: {
    ...mapGetters([`networks`]),
    mainNetworks() {
      return [
        { id: 'mainnet', chain_id: 'wns-mainnet', testnet: false, title: 'Wireline Mainnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'mainnet', default: true }
        ]
    },
    testNetworks() {
      return [
        { id: 'moon', chain_id: 'moon', testnet: true, title: 'Moon Devnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'moon', default: true },
        { id: 'phobos', chain_id: 'phobos', testnet: true, title: 'Phobos Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'phobos', default: true },
        { id: 'mars', chain_id: 'mars', testnet: true, title: 'Mars Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'mars', default: true },
        { id: 'mercury', chain_id: 'mercury', testnet: true, title: 'Mercury Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'mercury', default: true },
        { id: 'venus', chain_id: 'venus', testnet: true, title: 'Venus Testnet', icon: 'https://avatars3.githubusercontent.com/u/57182821?s=60&v=4', slug: 'venus', default: true }
        ]
    },
  },
}
</script>
<style scoped>
.select-network {
  overflow: auto;
}
</style>
