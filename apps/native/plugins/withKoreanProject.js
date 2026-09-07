const { withXcodeProject } = require("@expo/config-plugins");

/**
 * Info.plist 는 app.config.js 가 잡아 주지만 Xcode 프로젝트 파일은 못 잡는다.
 * prebuild 가 ios/ 를 통째로 다시 만들면서 developmentRegion 을 en 으로 되돌리고,
 * 그러면 앱스토어가 기본 언어를 영어로 본다.
 *
 * 손으로 고치면 다음 prebuild 에 사라지므로 여기서 매번 다시 적용한다.
 */
module.exports = function withKoreanProject(config) {
  return withXcodeProject(config, (cfg) => {
    const root = cfg.modResults.getFirstProject().firstProject;

    root.developmentRegion = "ko";
    if (Array.isArray(root.knownRegions)) {
      // Base 는 지역이 아니라 스토리보드의 기준 파일이라 남겨야 한다.
      root.knownRegions = root.knownRegions.map((region) =>
        region === "en" ? "ko" : region
      );
    }

    return cfg;
  });
};
