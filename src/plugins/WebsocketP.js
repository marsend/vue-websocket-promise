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
  let _queue = []
  let _callbacks = []
  let _websocketP = null
  let _reconnectServer = () => {
    Vue.request(constants.socketAPI.userPostSession).then(function (resp) {
      console.log('init session')
      console.log(_queue)
      if (_queue.length > 0) {
        return q.all(_queue.map(function (item) {
          let tq = q.defer()
          _websocketP.send(item)
          return tq.resolve()
        }))
      }
    })
  }
  Vue.request = (api) => {
    let nextRequestId = null
    let deferred = null
    let requestBody = ''
    if (typeof api == 'string') {
      requestBody = api
    } else {
      nextRequestId = Vue.getRequestId()
      deferred = q.defer()
      _callbacks[nextRequestId] = deferred
      requestBody = JSON.stringify(api(nextRequestId))
      console.log('add callback ' + requestBody)
    }

    if (_websocketP.readyState == 1) {
      try {
        _websocketP.send(requestBody)
      } catch (e) {
        _queue.push(requestBody)
        console.group('webocket not connected')
        console.warn(e)
        console.groupEnd()
      }
    } else {
      _queue.push(requestBody)
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
        _websocketP = new ReconnectingWebsocket(constants.WS_URL)
        console.log('websocketp created')
        _websocketP.onopen = function () {
          console.log('socket opened')
          console.log(_queue)
          console.log(_callbacks)
          setInterval(() => {
            _websocketP.send('PING')
          }, 10000)
          _reconnectServer()
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
                _reconnectServer()
                break
              default:
                let handleRequestId = respData['s']
                if (_callbacks[handleRequestId]) {
                  let callback = _callbacks[handleRequestId]
                  delete _callbacks[handleRequestId]
                  callback.resolve(respData)
                  console.log(callback)
                  console.log(_callbacks)
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
      request: Vue.request,

    }
  })
}

WebsocketP.install = install

export default WebsocketP
