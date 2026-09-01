const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Monorepo: workspace paketlerini izle, iki node_modules kokunu da tara.
// pnpm'de hiyerarsik arama kapatilmaz — paketler kendi ic node_modules'unu kullanir.
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
