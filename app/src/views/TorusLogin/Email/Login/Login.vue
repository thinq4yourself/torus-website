<template>
  <div class="default">
    <v-layout wrap fill-height align-center justify-center class="login-panel-left">
      <v-flex xs10 md6>
        <v-layout wrap>
          <v-flex class="mb-5" xs12 sm12 ml-auto mr-auto>
            <img width="117" :src="require(`../../../../../public/images/torus-logo-${$vuetify.theme.dark ? 'white' : 'blue'}.svg`)" />
          </v-flex>
          <v-flex class="mb-3" xs12 sm12 ml-auto mr-auto>
            <span class="display-1 font-weight-bold">{{ t('emailLogin.login') }}</span>
          </v-flex>
          <v-flex :class="$vuetify.theme.dark ? '' : 'text_1--text'" class="body-2" mb-8 xs12 sm12 ml-auto mr-auto>
            <span>{{ t('login.message') }}</span>
          </v-flex>
          <v-flex xs12 sm12 ml-auto mb-2 pt-4 mr-auto>
            <v-flex xs12>
              <v-form ref="form" v-model="formValid" lazy-validation autocomplete="off" @submit.prevent="login">
                <v-layout wrap>
                  <v-flex xs12>
                    <v-text-field
                      id="verifier_id"
                      v-model="verifier_id"
                      outlined
                      type="email"
                      name="verifier_id"
                      :placeholder="t('emailLogin.enterEmail')"
                      elevation="4"
                      :rules="[rules.required, rules.validEmail]"
                      single-line
                      autocomplete="email"
                    >
                      <template v-slot:prepend-inner>
                        <img class="mr-2 mt-1" :src="require(`../../../../../public/images/email.svg`)" height="16px" />
                      </template>
                    </v-text-field>
                  </v-flex>
                  <v-flex xs12>
                    <v-text-field
                      v-model="password"
                      outlined
                      name="password"
                      :placeholder="t('emailLogin.enterPassword')"
                      :rules="[rules.required, rules.minLength]"
                      :append-icon="showPassword ? '$vuetify.icons.visibility_off' : '$vuetify.icons.visibility_on'"
                      :type="showPassword ? 'text' : 'password'"
                      class="password"
                      single-line
                      autocomplete="current-password"
                      @click:append.prevent="showPassword = !showPassword"
                      @keyup="resetError"
                    >
                      <template v-slot:prepend-inner>
                        <img class="mr-2 mt-1" :src="require(`../../../../../public/images/lock.svg`)" height="20px" />
                      </template>
                    </v-text-field>
                    <div class="v-text-field__details mb-6">
                      <div class="v-messages">
                        <div class="v-messages__wrapper">
                          <div class="v-messages__message d-flex text_2--text">
                            <v-flex>
                              <!-- <span class="caption">
                                <router-link :to="{ path: 'forgot', query: { state, redirect_uri: redirectURI, email: verifier_id } }">
                                  Forgot password?
                                </router-link>
                              </span> -->
                            </v-flex>
                            <v-flex grow-shrink-0>
                              <span class="caption">
                                {{ t('emailLogin.dontHaveAcnt') }}
                                <router-link :to="{ name: 'torusEmailRegister', query: { state, redirect_uri: redirectURI, email: verifier_id } }">
                                  {{ t('emailLogin.signUpHere') }}
                                </router-link>
                              </span>
                            </v-flex>
                          </div>
                        </div>
                      </div>
                    </div>
                  </v-flex>

                  <v-flex xs12>
                    <v-btn
                      color="primary"
                      :disabled="!formValid"
                      class="body-1 font-weight-bold card-shadow-v8 login-btn"
                      large
                      depressed
                      block
                      type="submit"
                    >
                      {{ t('emailLogin.loginNoSpace') }}
                    </v-btn>
                  </v-flex>

                  <v-flex v-if="notRegistered" xs12 py-3>
                    <span>
                      {{ t('emailLogin.notRegistered') }}
                      <router-link :to="{ name: 'torusEmailRegister', query: { state, redirect_uri: redirectURI, email: verifier_id } }">
                        {{ t('emailLogin.signUpHere') }}
                      </router-link>
                    </span>
                  </v-flex>
                  <v-flex v-if="incorrectPassword" xs12 py-3>
                    <span>
                      {{ t('emailLogin.pleaseTryAgainEmail') }}
                    </span>
                  </v-flex>
                </v-layout>
              </v-form>
            </v-flex>
          </v-flex>
          <v-flex class="headline" mb-6 xs12 sm12 ml-auto mr-auto>
            <span class="text_2--text body-1">
              {{ t('login.acceptTerms') }}
              <a href="https://docs.tor.us/legal/terms-and-conditions" target="_blank">
                <span class="primary--text">{{ t('login.termsAndConditions') }}</span>
              </a>
            </span>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import * as ethUtil from 'ethereumjs-util'
import log from 'loglevel'
import { sha3 } from 'web3-utils'

import config from '../../../../config'
import { post } from '../../../../utils/httpHelpers'

export default {
  data() {
    return {
      showPassword: false,
      verifier_id: '',
      password: '',
      formValid: true,
      redirectURI: '',
      state: '',
      notRegistered: false,
      incorrectPassword: false,
      rules: {
        required: (value) => !!value || this.t('emailLogin.required'),
        minLength: (value) => value.length >= 8 || this.t('emailLogin.passwordLength'),
        validEmail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || this.t('emailLogin.invalidEmail'),
      },
    }
  },
  computed: {
    extendedPassword() {
      return ethUtil.stripHexPrefix(sha3(this.password))
    },
  },
  mounted() {
    const { state, redirect_uri: redirectURI, email } = this.$route.query
    this.state = state
    this.redirectURI = redirectURI
    this.verifier_id = email || ''
  },
  methods: {
    resetError() {
      this.incorrectPassword = false
    },
    async login() {
      try {
        if (!this.$refs.form.validate()) return
        const data = await post(`${config.torusVerifierHost}/authorize`, {
          verifier_id: this.verifier_id,
          verifier_id_type: 'email',
          redirect_uri: this.redirectURI,
          state: this.state,
          hash: ethUtil.stripHexPrefix(sha3(this.extendedPassword)),
        })
        const completeRedirectURI = new URL(data.redirect_uri)
        completeRedirectURI.hash = `idtoken=${data.idtoken}&timestamp=${data.timestamp}\
          &verifier_id=${data.verifier_id}&extendedPassword=${this.extendedPassword}&state=${data.state}`
        window.location.href = completeRedirectURI.href
      } catch (error) {
        if (error && error.status === 404) this.notRegistered = true
        else if (error && error.status === 403) this.incorrectPassword = true
        log.error(error)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'Login.scss';
</style>
