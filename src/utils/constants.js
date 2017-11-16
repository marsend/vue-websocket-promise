/**
 * Created by miaUser on 01/11/2017.
 */
// import cookie from 'js-cookie'
import mockData from '@/utils/mockdata'
const commonBody = {
  'r': 1,
  's': new Date().getTime(),
  'a': 2,
  'b': '1.0.1',
  'g': mockData.user.guid,
  'v': {}
}
export default {
  WS_URL: 'wss://ws-course.miamusic.com/',
  socketAPI: {
    userGetWxpclogin () {
      return {
        ...commonBody,
        'c': 'User.Get.Wxpclogin',
        'v': {}
      }
    },
    userPostSession (s) {
      return {
        ...commonBody,
        's': s,
        'c': 'User.Post.Session',
        'v': {
          'guid': mockData.user.guid,
          'uID': mockData.user.ID,
          'token': mockData.user.token
        }
      }
    },
    courseGetInfo (s) {
      return {
        ...commonBody,
        's': s,
        'c': 'Course.Get.Info',
        'v': {
          'roomID': '10594'
        }
      }
    },
    courseRoomInfo (s) {
      return {
        ...commonBody,
        's': s,
        'c': 'Course.Room.Info',
        'v': {
          'roomID': '1489'
        }
      }
    }
  }
}
