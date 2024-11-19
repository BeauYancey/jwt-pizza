import { sleep, group, check, fail } from 'k6'
import http from 'k6/http'
import { diner } from './user'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '15s' },
        { target: 10, duration: '30s' },
        { target: 5, duration: '15s' },
        { target: 0, duration: '15s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response
  let vars = {}

  group('Login & Order - https://pizza.yanceydev.com/', function () {
    // Home Page
    response = http.get('https://pizza.yanceydev.com/', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        dnt: '1',
        'if-modified-since': 'Wed, 30 Oct 2024 01:21:54 GMT',
        'if-none-match': '"7ff3482eebc38cb3cc45fb8209398182"',
        priority: 'u=0, i',
        'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
    })
    sleep(3)

    // Login
    response = http.put(
      'https://pizza-service.yanceydev.com/api/auth',
      `{"email":"${diner.email}","password":"${diner.password}"}`,
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.yanceydev.com',
          priority: 'u=1, i',
          'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
      console.log(response.body);
      fail('Login was *not* 200');
    }
    vars['token'] = response.json('token')
    sleep(3)

    // Menu
    response = http.get('https://pizza-service.yanceydev.com/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        dnt: '1',
        'if-none-match': 'W/"1fc-cgG/aqJmHhElGCplQPSmgl2Gwk0"',
        origin: 'https://pizza.yanceydev.com',
        priority: 'u=1, i',
        'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })

    // Stores
    response = http.get('https://pizza-service.yanceydev.com/api/franchise', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        dnt: '1',
        'if-none-match': 'W/"40-EPPawbPn0KtYVCL5qBynMCqA1xo"',
        origin: 'https://pizza.yanceydev.com',
        priority: 'u=1, i',
        'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(3)

    // Place Order
    response = http.post(
      'https://pizza-service.yanceydev.com/api/order',
      '{"items":[{"menuId":2,"description":"Pepperoni","price":0.0042}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.yanceydev.com',
          Authorization: `Bearer ${vars['token']}`,
          priority: 'u=1, i',
          'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    vars['jwt'] = response.json('jwt')
    sleep(3)

    // Verify
    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      `{"jwt":"${vars['jwt']}"}`,
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.yanceydev.com',
          Authorization: `Bearer ${vars['token']}`,
          priority: 'u=1, i',
          'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
          'sec-ch-ua-mobile': '?1',
          'sec-ch-ua-platform': '"Android"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
      }
    )
    sleep(3)

    // Logout
    response = http.del('https://pizza-service.yanceydev.com/api/auth', null, {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        dnt: '1',
        origin: 'https://pizza.yanceydev.com',
        Authorization: `Bearer ${vars['token']}`,
        priority: 'u=1, i',
        'sec-ch-ua': '"Not?A_Brand";v="99", "Chromium";v="130"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
  })
}