<template>
  <div class="page__index">
    <button @click="sendRequest">send</button>
    <button @click="closeSocket">close</button>
  </div>
</template>

<script>

  import q from 'q'
  import ReconnectingWebsocket from 'reconnecting-websocket'
  import constants from '@/utils/constants'
  export default {
    name: 'hello',
    data () {
      return {
        title: 'mars title'
      }
    },
    created () {
      var self = this
    },
    methods: {
      sendRequest() {
        this.request(constants.socketAPI.courseGetInfo).then((resp) => {
          console.group('handle courseGetInfo request')
          console.log(resp)
          console.groupEnd()
          this.request(constants.socketAPI.courseRoomInfo).then((resp) => {
            console.group('handle courseRoomInfo request')
            console.log(resp)
            console.groupEnd()
          })
        })
        this.request(constants.socketAPI.courseRoomInfo).then((resp) => {
          console.group('handle courseRoomInfo request')
          console.log(resp)
          console.groupEnd()
        })
      }
    }

  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
