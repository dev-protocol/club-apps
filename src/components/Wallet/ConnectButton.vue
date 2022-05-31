<template>
  <div class="rounded border px-4 py-2">
    <div v-if="walletAddress">
      <a href="/me">{{ walletAddress }}</a>
    </div>
    <div v-else v-on:click="connect">Connect Wallet</div>
  </div>
</template>

<script lang="ts">
import { providers } from 'ethers'
import { whenDefined } from '@devprotocol/util-ts'
import { ReConnectWallet, GetModalProvider } from '../../fixtures/wallet'
import { getConnection } from '@devprotocol/elements'
import { connectionId } from '../../constants/connection'

export default {
  name: 'ConnectButton',
  data() {
    const modalProvider = GetModalProvider()
    return {
      modalProvider,
      walletAddress: '',
    }
  },
  async mounted() {
    const { currentAddress, provider } = await ReConnectWallet(
      // @ts-ignore
      this.modalProvider
    )
    if (currentAddress) {
      // @ts-ignore
      this.walletAddress = currentAddress
    }
    if (provider) {
      // @ts-ignore
      this.setSigner(provider)
    }
  },
  methods: {
    setSigner(provider: providers.Web3Provider) {
      getConnection(connectionId)?.signer.next(provider.getSigner())
    },
    async connect() {
      // @ts-ignore
      const connectedProvider = await this.modalProvider.connect()
      const newProvider = whenDefined(connectedProvider, (p) => {
        const provider = new providers.Web3Provider(p)
        this.setSigner(provider)
        return provider
      })

      const currentAddress = await newProvider?.getSigner().getAddress()
      // @ts-ignore
      this.walletAddress = currentAddress
    },
  },
}
</script>
