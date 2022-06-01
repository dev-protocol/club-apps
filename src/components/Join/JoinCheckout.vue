<template>
  <div
    v-if="!stakeSuccessful"
    class="relative mx-auto grid lg:container lg:grid-cols-[auto,_480px] lg:gap-12 lg:pt-12"
  >
    <section class="flex flex-col">
      <h2 class="mb-8 text-4xl">Join</h2>
      <div class="mb-8">
        <h3 class="mb-4 text-2xl">Approval</h3>
        <button
          @click="approve"
          v-if="approveNeeded"
          class="rounded-sm border bg-gray-600 p-2 px-4"
        >
          Sign with wallet and approve
        </button>
        <button
          v-if="!approveNeeded"
          disabled
          class="rounded-sm border border-gray-400 bg-gray-600 p-2 px-4 text-gray-400"
        >
          You've already approved
        </button>
      </div>
      <div class="mb-8">
        <h3 class="mb-4 text-2xl">Stake</h3>
        <button
          @click="submitStake"
          class="rounded-sm border bg-gray-600 p-2 px-4"
        >
          Stake DEV on Awesome Club
        </button>
      </div>
    </section>
    <div class="grid grid-cols-1 content-start p-4">
      <div class="border border-b-0 border-accent p-4">
        <h3 class="text-2xl opacity-70">Stake</h3>
        <div class="text-2xl">{{ amount }} DEV</div>
      </div>
      <div class="border border-accent p-4">
        <h3 class="text-2xl opacity-70">Estimated earnings/year</h3>
        <div class="text-2xl">10 DEV</div>
      </div>
    </div>
  </div>
  <section
    style="height: calc(100vh - 74px)"
    class="flex flex-col items-center justify-center"
    v-if="stakeSuccessful"
  >
    <h2 class="mb-8 text-4xl">Joined</h2>
    <a href="/" class="text-blue-400">Back to top</a>
  </section>
</template>

<script lang="ts">
import {
  clientsDev,
  positionsCreate,
  positionsCreateWithEth,
} from '@devprotocol/dev-kit/agent'
import { getConnection } from '@devprotocol/elements'
import { whenDefinedAll } from '@devprotocol/util-ts'
import { defineComponent } from '@vue/composition-api'
import { BigNumber, constants, providers, utils } from 'ethers'
import { parse } from 'query-string'
import { Subscription, zip } from 'rxjs'
import { connectionId } from 'src/constants/connection'
import { CurrencyOption } from 'src/constants/currencyOption'

type Data = {
  currency: CurrencyOption
  approveNeeded: boolean
  subscriptions: Subscription[]
  stakeSuccessful: boolean
}

export default defineComponent({
  props: {
    amount: Number,
    destination: String,
  },
  data() {
    return {
      currency: CurrencyOption.DEV,
      approveNeeded: false,
      subscriptions: [],
      stakeSuccessful: false,
    } as Data
  },
  mounted() {
    const query = parse(location.search)
    const input = String(query.input).toLowerCase()
    this.currency = input === 'eth' ? CurrencyOption.ETH : CurrencyOption.DEV
    const connection = getConnection(connectionId)

    if (this.currency === CurrencyOption.ETH) {
      this.approveNeeded = false
    } else {
      if (connection) {
        const sub = zip(connection.provider, connection.account).subscribe(
          async ([provider, account]) => {
            await whenDefinedAll(
              [provider, account, this.destination],
              async ([prov, userAddress, destination]) => {
                this.checkApproved(prov, userAddress, destination)
              }
            )
          }
        )
        this.subscriptions.push(sub)
      }
    }
  },
  destroyed() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe()
    }
  },
  methods: {
    async approve() {
      const connection = getConnection(connectionId)
      if (connection) {
        const sub = zip(connection.provider).subscribe(async ([provider]) => {
          await whenDefinedAll(
            [provider, this.destination],
            async ([prov, destination]) => {
              const [l1, _] = await clientsDev(prov)
              const res = await l1?.approve(
                destination,
                constants.MaxUint256.toString()
              )
              if (res) {
                await res?.wait()
                console.log('approve res is: ', res)
                this.approveNeeded = false
              }
            }
          )
        })
        this.subscriptions.push(sub)
      }
    },
    async checkApproved(
      provider: providers.Provider,
      userAddress: string,
      destination: string
    ) {
      const [l1, _] = await clientsDev(provider)
      const allowance = BigNumber.from(
        (await l1?.allowance(userAddress, destination)) ?? 0
      )
      this.approved = allowance?.gt(this.amount ?? 0) ?? false
    },
    async submitStake() {
      const connection = getConnection(connectionId)
      if (connection) {
        const sub = zip(connection.provider, connection.account).subscribe(
          async ([provider, account]) => {
            await whenDefinedAll(
              [provider, account, this.destination],
              async ([prov, userAddress, destination]) => {
                if (this.currency === CurrencyOption.ETH) {
                  // handle ETH stake
                  const res = await whenDefinedAll(
                    [provider, account, this.amount, this.destination],
                    ([prov, from, amount, destination]) =>
                      positionsCreateWithEth({
                        provider: prov,

                        destination,
                        ethAmount: utils
                          .parseUnits(amount.toString(), 18)
                          .toString(),
                      })
                  )

                  if (res) {
                    res
                      .create()
                      .then((res) => res.wait())
                      .then((res) => {
                        console.log('res is: ', res)
                        this.stakeSuccessful = true
                      })
                  }
                } else {
                  // handle DEV stake
                  const res = await whenDefinedAll(
                    [provider, account, this.amount, this.destination],
                    ([prov, from, amount, destination]) =>
                      positionsCreate({
                        provider: prov,
                        from,
                        destination,
                        amount: utils
                          .parseUnits(amount.toString(), 18)
                          .toString(),
                      })
                  )
                  if (res) {
                    res
                      .approveIfNeeded()
                      .then((res) => res.waitOrSkip())
                      .then((res) => {
                        console.log('res is: ', res)
                        this.stakeSuccessful = true
                      })
                  }
                }
              }
            )
          }
        )
        this.subscriptions.push(sub)
      }
    },
  },
})
</script>
