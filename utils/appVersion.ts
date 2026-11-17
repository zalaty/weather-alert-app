import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';

interface VersionSources {
  /** En Expo Go no hay build propio: nativeApplicationVersion/nativeBuildVersion serían los de Expo Go */
  isExpoGo: boolean;
  nativeVersion: string | null;
  nativeBuild: string | null;
  configVersion: string | undefined;
}

/** "1.4.1 (28)" en un build real; solo "1.4.1" en Expo Go o si falta el número de build. */
export function formatAppVersion({ isExpoGo, nativeVersion, nativeBuild, configVersion }: VersionSources): string {
  if (isExpoGo) return configVersion ?? '';
  const version = nativeVersion ?? configVersion ?? '';
  return nativeBuild ? `${version} (${nativeBuild})` : version;
}

export function getAppVersionLabel(): string {
  return formatAppVersion({
    isExpoGo: Constants.executionEnvironment === ExecutionEnvironment.StoreClient,
    nativeVersion: Application.nativeApplicationVersion,
    nativeBuild: Application.nativeBuildVersion,
    configVersion: Constants.expoConfig?.version,
  });
}
