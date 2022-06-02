<template>
  <div class="rounded border px-4 py-2">
    <div v-if="truncateWalletAddress">
      <a href="/me">{{ truncateWalletAddress }}</a>
    </div>
    <div v-else v-on:click="connect">Connect Wallet</div>
  </div>
</template>

<script lang="ts">
import { providers } from 'ethers'
import truncateEthAddress from 'truncate-eth-address'
import { whenDefined } from '@devprotocol/util-ts'
import { ReConnectWallet, GetModalProvider } from '../../fixtures/wallet'
import { getConnection } from '@devprotocol/elements'
import { connectionId } from '../../constants/connection'
import Core from 'web3modal'
import { defineComponent } from '@vue/runtime-core'

type Data = {
  modalProvider: Core,
  truncateWalletAddress: String
}

export default defineComponent ({
  name: 'ConnectButton',
  data(): Data {
    const modalProvider = GetModalProvider()
    return {
      modalProvider,
      truncateWalletAddress: '',
    }
  },
  async mounted() {
    const { currentAddress, provider } = await ReConnectWallet(
      this.modalProvider
    )
    if (currentAddress) {
      this.truncateWalletAddress = truncateEthAddress(currentAddress)
    }
    if (provider) {
      this.setSigner(provider)
    }
  },
  methods: {
    setSigner(provider: providers.Web3Provider) {
      getConnection(connectionId)?.signer.next(provider.getSigner())
    },
    async connect() {
      const connectedProvider = await this.modalProvider.connect()
      const newProvider = whenDefined(connectedProvider, (p) => {
        const provider = new providers.Web3Provider(p)
        this.setSigner(provider)
        return provider
      })

      const currentAddress = await newProvider?.getSigner().getAddress()
      if (currentAddress) {
        this.truncateWalletAddress = truncateEthAddress(currentAddress)
      }
    },
  },
})
</script>
