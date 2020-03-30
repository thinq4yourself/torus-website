<template>
  <div class="default">
    <v-layout wrap fill-height align-center justify-center class="panel-left">
      <v-flex xs12 md6>
        <v-layout wrap>
          <v-flex class="mb-5" xs9 sm7 ml-auto mr-auto>
            <img width="117" :src="require(`../../../../../public/images/torus-logo-${$vuetify.theme.dark ? 'white' : 'blue'}.svg`)" />
          </v-flex>
          <v-flex class="mb-3" xs9 sm7 ml-auto mr-auto>
            <span class="display-1 font-weight-bold">{{ t('emailLogin.verification') }}</span>
          </v-flex>
          <v-flex class="display" mb-6 xs9 sm7 ml-auto mr-auto>
            <span>
              {{ t('emailLogin.checkEmailAndKey') }}
            </span>
          </v-flex>
          <v-flex xs9 sm7 ml-auto mb-2 mr-auto>
            <v-flex xs12>
              <v-form ref="form" v-model="formValid" lazy-validation autocomplete="off" @submit.prevent>
                <v-layout wrap>
                  <v-flex xs12 mb-4>
                    <v-text-field
                      v-model="code"
                      outlined
                      type="text"
                      name="code"
                      class="field"
                      :rules="[rules.required, rules.exactLength]"
                      :label="t('emailLogin.enterVerification')"
                      single-line
                      autocomplete="one-time-code"
                      @input="verifyAccount"
                    >
                      <template v-slot:append>
                        <img v-if="status === ''" class="mr-2" :src="require(`../../../../../public/images/shield.svg`)" height="20px" />
                        <img
                          v-if="status === 'success'"
                          class="mr-2"
                          :src="require(`../../../../../public/images/valid-check.svg`)"
                          height="20px"
                          :title="t('emailLogin.verifySuccess')"
                        />
                        <img v-if="status === 'error'" class="mr-2" :src="require(`../../../../../public/images/invalid-check.svg`)" height="20px" />
                      </template>
                    </v-text-field>
                    <div class="v-text-field__details mb-6">
                      <div class="v-messages">
                        <div class="v-messages__wrapper">
                          <div class="v-messages__message d-flex text_2--text">
                            <v-flex>
                              {{ t('emailLogin.pleaseTryAgain') }}
                              <a @click="resendCode">{{ t('emailLogin.resendCode') }}</a>
                            </v-flex>
                          </div>
                        </div>
                      </div>
                    </div>
                  </v-flex>
                </v-layout>
              </v-form>
            </v-flex>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex v-if="$vuetify.breakpoint.smAndUp" xs12 sm4 md6 fill-height class="panel-right" :class="$vuetify.theme.dark ? 'torus-dark' : ''">
        <v-layout class="pb-8" wrap fill-height align-end>
          <v-flex class="mb-3 text-center" xs9 sm8 md10 ml-auto mr-auto>
            <div class="right-panel-header white--text font-weight-bold mb-2">{{ t('login.frictionless') }}</div>
            <div class="body-2 right-panel-subheader white--text mx-auto">
              {{ t('login.simpleSecure') }}
            </div>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import log from 'loglevel'

import config from '../../../../config'
import { post } from '../../../../utils/httpHelpers'

export default {
  data() {
    return {
      code: '',
      verifier_id: '',
      status: '',
      hash: '',
      formValid: true,
      rules: {
        required: (value) => !!value || this.t('emailLogin.required'),
        exactLength: (value) => value.length === 6 || this.t('emailLogin.codeMustBe'),
      },
    }
  },
  mounted() {
    const { email, hash } = this.$route.query
    this.verifier_id = email
    this.hash = hash
  },
  methods: {
    async verifyAccount() {
      try {
        if (!this.$refs.form.validate()) return
        await post(`${config.torusVerifierHost}/verify`, {
          verifier_id: this.verifier_id,
          verifier_id_type: 'email',
          code: this.code,
          hash: this.hash,
        })
        this.status = 'success'
        let finalRoutePath = { name: 'torusEmailLogin', query: { ...this.$route.query, email: this.verifier_id } }
        if (!Object.prototype.hasOwnProperty.call(this.$route.query, 'state')) finalRoutePath = { path: '/' }
        this.$router.push(finalRoutePath).catch((_) => {})
      } catch (error) {
        this.status = 'error'
        log.error(error)
      }
    },
    async resendCode() {
      await post(`${config.torusVerifierHost}/register`, {
        verifier_id: this.verifier_id,
        verifier_id_type: 'email',
        hash: this.hash,
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'Verification.scss';
</style>
