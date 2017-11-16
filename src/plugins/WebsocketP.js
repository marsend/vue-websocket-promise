/**
 * Created by miaUser on 08/11/2017.
 */
import ReconnectingWebsocket from 'reconnecting-websocket'
import q from 'q'
import constants from '@/utils/constants'
let _Vue
let WebsocketP = {}

var isDef = function (v) { return v !== undefined }
var isNull = function (v) { return v === null }

function install (Vue, Options) {
  if (install.installed && _Vue == Vue) {return}
  install.installed = true
  _Vue = Vue

  let _requestId = 0
  //socket send queue
  let _queue = []
  //socket handle queue
  let _callbacks = []
  let _websocket = Options.websocket || ReconnectingWebsocket
  //reconnect websocket instance
  let _websocketP = null
  /*
  * websocket task called by situations for these:
  * 1.first time for websocket connected
  * 2.when socket request hang up
  * */
  let _socketTask = () => {
    Vue.socketRequest(constants.socketAPI.userPostSession).then(function (resp) {
      console.log('init session')
      console.log(_queue)
      if (_queue.length > 0) {
        return q.allSettled(_queue.map(function (item) {
          let tq = q.defer()
          _websocketP.send(item)
          return tq.resolve()
        })).then(function(results) {
          console.log('promise handle results')
          results.forEach((result, i) => {
            if(result.state === "fulfilled") {
              delete _queue[i]
            }
          })
          console.group('promise handle ended')
          console.log(_queue)
          console.groupEnd()
        })
      }
    })
  }
  /*
  * websocket request promise
  * */
  Vue.socketRequest = (api) => {
    let nextRequestId = null
    let deferred = null
    let requestBody = ''
    if (typeof api == 'string') {
      requestBody = api //cause this request had pushed into callback queue, so not need to push queue
    } else {
      nextRequestId = Vue.getRequestId()
      deferred = q.defer()
      _callbacks[nextRequestId] = deferred // push a callback into callback queue when it's first time to request
      requestBody = JSON.stringify(api(nextRequestId))
      console.log('add callback ' + requestBody)
    }

    // fire send when read state equals 1
    if (_websocketP.readyState == 1) {
      try {
        _websocketP.send(requestBody)
      } catch (e) {
        if (typeof api != 'string') {
          _queue.push(requestBody)
        }
        console.group('webocket not connected')
        console.warn(e)
        console.groupEnd()
        return deferred.reject(new Error('webocket not connected'))
      }
    } else {
      if (typeof api != 'string') {
        _queue.push(requestBody)
      }
    }

    return deferred.promise.then(function (resp) {
      return resp
    })

  }
  Vue.getRequestId = () => {
    return _requestId++
  }
  Vue.mixin({
    created: () => {
      var self = this

      if (!isDef(_websocketP) || isNull(_websocketP)) {
        _websocketP = new _websocket(constants.WS_URL)
        console.log('websocketp created')
        _websocketP.onopen = function () {
          console.log('socket opened')
          console.log(_queue)
          console.log(_callbacks)
          setInterval(() => {
            _websocketP.send('PING')
          }, 30000)
          _socketTask()
        }
        _websocketP.onmessage = (res) => {
          if (res.data == 'PONG') {
            console.log('PONG')
          } else {
            console.log('on message')
            let respData = JSON.parse(res.data)
            let ret = respData.v.ret
            switch (ret) {
              case 1000:
                _socketTask()
                break
              default:
                let handleRequestId = respData['s']
                if (_callbacks[handleRequestId]) {
                  let callback = _callbacks[handleRequestId]
                  delete _callbacks[handleRequestId]
                  callback.resolve(respData)
                  console.log(callback)
                  console.group('remaining callbacks');
                  console.log(_callbacks)
                  console.groupEnd()
                }
                break
            }
          }
        }
      }
    },
    methods: {
      closeSocket() {
        _websocketP.close()
      },
      socketRequest: Vue.socketRequest,

    }
  })
}

WebsocketP.install = install

export default WebsocketP
