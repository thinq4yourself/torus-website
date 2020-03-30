<template>
  <div class="default">
    <v-layout wrap fill-height align-center justify-center class="register-panel-left">
      <v-flex xs10 md6>
        <v-layout wrap>
          <v-flex class="mb-5" xs12 sm12 ml-auto mr-auto>
            <img width="117" :src="require(`../../../../../public/images/torus-logo-${$vuetify.theme.dark ? 'white' : 'blue'}.svg`)" />
          </v-flex>
          <v-flex class="mb-3" xs12 sm12 ml-auto mr-auto>
            <span class="display-1 font-weight-bold">{{ t('emailLogin.signUp') }}</span>
          </v-flex>
          <v-flex xs12 sm12 ml-auto mb-2 pt-4 mr-auto>
            <v-flex xs12>
              <v-form ref="form" v-model="formValid" lazy-validation autocomplete="off" @submit.prevent="registerAccount">
                <v-layout wrap>
                  <v-flex xs12>
                    <v-text-field
                      v-model="verifier_id"
                      outlined
                      type="text"
                      name="verifier_id"
                      :label="t('emailLogin.enterEmail')"
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
                      :label="t('emailLogin.enterPassword')"
                      :append-icon="showPassword ? '$vuetify.icons.visibility_off' : '$vuetify.icons.visibility_on'"
                      :type="showPassword ? 'text' : 'password'"
                      single-line
                      :rules="[rules.required, rules.minLength]"
                      autocomplete="new-password"
                      @click:append.prevent="showPassword = !showPassword"
                    >
                      <template v-slot:prepend-inner>
                        <img class="mr-2" :src="require(`../../../../../public/images/lock.svg`)" height="20px" />
                      </template>
                    </v-text-field>
                  </v-flex>
                  <v-flex xs12>
                    <v-text-field
                      v-model="confirmPassword"
                      outlined
                      name="confirmPassword"
                      :label="t('emailLogin.confirmPassword')"
                      :append-icon="showConfirmPassword ? '$vuetify.icons.visibility_off' : '$vuetify.icons.visibility_on'"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      single-line
                      :rules="[rules.required, rules.confirmPassword]"
                      autocomplete="new-password"
                      @click:append.prevent="showConfirmPassword = !showConfirmPassword"
                    >
                      <template v-slot:prepend-inner>
                        <img class="mr-2" :src="require(`../../../../../public/images/lock.svg`)" height="20px" />
                      </template>
                    </v-text-field>
                    <div class="v-text-field__details mb-6">
                      <div class="v-messages">
                        <div class="v-messages__wrapper">
                          <div class="v-messages__message d-flex text_2--text">
                            <v-flex></v-flex>
                            <v-flex grow-shrink-0>
                              <span class="caption">
                                {{ t('emailLogin.haveAccountQuestion') }}
                                <router-link :to="{ name: 'torusEmailLogin', query: { state, redirect_uri: redirectURI, email: verifier_id } }">
                                  {{ t('emailLogin.here') }}
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
                      type="submit"
                      :disabled="!formValid"
                      class="body-1 font-weight-bold card-shadow-v8 register-btn"
                      large
                      depressed
                      block
                    >
                      {{ t('emailLogin.signUp') }}
                    </v-btn>
                  </v-flex>
                  <v-flex v-if="duplicate" xs12 py-3>
                    <span>
                      {{ t('emailLogin.haveAccount') }}
                      <router-link :to="{ name: 'torusEmailLogin', query: { state, redirect_uri: redirectURI, email: verifier_id } }">
                        {{ t('emailLogin.here') }}
                      </router-link>
                    </span>
                  </v-flex>
                </v-layout>
              </v-form>
            </v-flex>
          </v-flex>
          <v-flex class="caption" mb-6 xs12 sm12 ml-auto mr-auto>
            <span class="text_2--text body-1">
              {{ t('login.acceptTerms') }}
              <a href="https://docs.tor.us/legal/terms-and-conditions" target="_blank" rel="noreferrer noopener">
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
      password: '',
      confirmPassword: '',
      verifier_id: '',
      showPassword: false,
      showConfirmPassword: false,
      formValid: true,
      duplicate: false,
      redirectURI: '',
      state: '',
      rules: {
        required: (value) => !!value || this.t('emailLogin.required'),
        minLength: (value) => value.length >= 8 || this.t('emailLogin.passwordLength'),
        confirmPassword: (value) => value === this.password || this.t('emailLogin.passwordNotMatch'),
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
    async registerAccount() {
      if (!this.$refs.form.validate()) return
      try {
        const hash = ethUtil.stripHexPrefix(sha3(this.extendedPassword))
        await post(`${config.torusVerifierHost}/register`, {
          verifier_id: this.verifier_id,
          verifier_id_type: 'email',
          hash,
        })
        this.$router.push({ name: 'torusEmailVerify', query: { ...this.$route.query, email: this.verifier_id, hash } }).catch((_) => {})
      } catch (error) {
        if (error && error.status === 403) this.duplicate = true
        log.error(error)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'Register.scss';
</style>
