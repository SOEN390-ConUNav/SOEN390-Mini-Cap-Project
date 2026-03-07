const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin that sets the Gradle wrapper to 8.13 so the Android build
 * satisfies the minimum required by the Android Gradle Plugin (e.g. after RN 0.82).
 * Run after prebuild so the value persists when android/ is regenerated.
 */
function withGradleWrapper(config) {
  return {
    ...config,
    mods: {
      ...config.mods,
      android: {
        ...config.mods?.android,
        async dangerous(...args) {
          const data = await (config.mods?.android?.dangerous?.(...args) ??
            args[0]);
          const projectRoot = data.modRequest.projectRoot;
          const wrapperPath = path.join(
            projectRoot,
            "android",
            "gradle",
            "wrapper",
            "gradle-wrapper.properties",
          );
          if (!fs.existsSync(wrapperPath)) return data;
          let content = fs.readFileSync(wrapperPath, "utf8");
          content = content.replace(
            /distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle-\d+\.\d+(-all|-bin)?\.zip/,
            "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip",
          );
          fs.writeFileSync(wrapperPath, content);
          return data;
        },
      },
    },
  };
}

module.exports = withGradleWrapper;
