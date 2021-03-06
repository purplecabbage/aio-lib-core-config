/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const fs = require('fs')
const path = require('path')
const envFile = Symbol.for(`aio-cli-config.envfile`)
const envVars = Symbol.for(`aio-cli-config.envVars`)
const debug = require('debug')('aio-cli-config')
const dotenv = require('dotenv')

/**
 * parse file for environmental variables
 *
 * @param {String} file filepath to parse
 */
const parse = (file) => {
  const buf = Buffer.from(fs.readFileSync(file, 'utf-8'))
  return dotenv.parse(buf) // will return an object
}

/**
 * returns all keys in o1 that arent in o2
 *
 * @param {Object} o1
 * @param {Object} o2
 *
 * @return {Array} array of keys
 */
const diff = (o1, o2) => Object.keys(o1).filter(k => !(k in o2))

/**
 * clears prviously hoisted environment variables from process.env
 */
const clear = () => {
  let existingKeys = global[envVars]
  if (existingKeys && existingKeys.forEach) {
    for (let key of existingKeys) {
      delete process.env[key]
    }
    delete global[envVars]
  }
}

/**
 * hoists variables in the ./.env file to process.env
 *
 * @param {Function} debug optional function for debugging
 *
 */
module.exports = function(force = false) {
  const file = path.join(process.cwd(), '.env')
  if (force || global[envFile] !== file) {
    try {
      clear()
      const envs = parse(file)
      const newKeys = diff(envs, process.env).sort()

      debug(`loading environment variables from ${file}`)

      if (newKeys.length > 0) {
        process.env = { ...envs, ...process.env }
        debug(`added environment variable(s): ${newKeys.join(', ')}`)
        global[envVars] = newKeys
      }
    } catch (ex) {
      if (ex.code !== 'ENOENT') {
        debug(`cannot read environment variables from ${file}`)
        debug(` - ${ex}`)
        debug('skipping ...')
      }
    }
  }
  global[envFile] = file
}
