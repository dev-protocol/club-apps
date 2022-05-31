<template>
  <section class="flex flex-col">
    <h2 class="mb-8 text-4xl">Join</h2>
    <div class="mb-8">
      <h3 class="mb-4 text-2xl">Approval</h3>
      <button class="rounded-sm border bg-gray-600 p-2 px-4">
        Sign with wallet and approve
      </button>
    </div>
    <div class="mb-8">
      <h3 class="mb-4 text-2xl">Stake</h3>
      <button class="rounded-sm border bg-gray-600 p-2 px-4">
        Stake DEV on Awesome Club
      </button>
    </div>
  </section>
</template>

<script lang="ts">
import { positionsCreate } from '@devprotocol/dev-kit/agent'
import { getConnection } from '@devprotocol/elements'
import { UndefinedOr, whenDefinedAll } from '@devprotocol/util-ts'
import { defineComponent } from '@vue/composition-api'
import { utils } from 'ethers'
import { parse } from 'query-string'
import { Subscription, zip } from 'rxjs'
import { connectionId } from 'src/constants/connection'

type Data = {
  currency: 'dev' | 'eth'
  approveNeeded: boolean
  subscription: UndefinedOr<Subscription>
}

export default defineComponent({
  props: {
    amount: Number,
    destination: String,
  },
  data() {
    return {
      currency: 'dev',
      approveNeeded: true,
      subscription: undefined,
    } as Data
  },
  mounted() {
    const query = parse(location.search)
    const input = String(query.input).toLowerCase()
    this.currency = input === 'eth' ? input : this.currency
    this.approveNeeded = input === 'eth' ? false : true
    const connection = getConnection(connectionId)
    if (connection) {
      this.subscription = zip(
        connection.provider,
        connection.account
      ).subscribe(async ([provider, account]) => {
        const res = await whenDefinedAll(
          [provider, account, this.amount, this.destination],
          ([prov, from, amount, destination]) =>
            positionsCreate({
              provider: prov,
              from,
              destination,
              amount: utils.parseUnits(amount.toString(), 18).toString(),
            })
        )
        if (res) {
          res
            .approveIfNeeded()
            .then((res) => res.waitOrSkip())
            .then((res) => res)
        }
      })
    }
  },
  destroyed() {
    this.subscription?.unsubscribe()
  },
})
</script>
