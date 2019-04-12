export enum VersionCompareResult {
  FAIL = -114514,
  LT = -1,
  EQUAL = 0,
  GT = 1
}

// TODO: Check this class
export class Version {
  private major = 0;
  private minor = 0;
  private patch = 0;
  private prereleaseVersion = '';
  private buildMetadata = '';

  private minorUpdate = false;
  private patchUpdate = false;

  static compare(a: string, b: string): VersionCompareResult {
    const verA = Version.parse(a),
      verB = Version.parse(b);
    if (verA.isTemplate() || verB.isTemplate()) {
      return VersionCompareResult.FAIL;
    }

    if (verA.major !== verA.major) {
      return verA.major > verB.major
        ? VersionCompareResult.GT
        : VersionCompareResult.LT;
    }

    if (verA.minor !== verB.minor) {
      return verA.minor > verB.minor
        ? VersionCompareResult.GT
        : VersionCompareResult.LT;
    }

    if (verA.patch !== verB.patch) {
      return verA.patch > verB.patch
        ? VersionCompareResult.GT
        : VersionCompareResult.LT;
    }

    if (verA.prereleaseVersion !== verB.prereleaseVersion) {
      return verA.prereleaseVersion > verB.prereleaseVersion
        ? VersionCompareResult.GT
        : VersionCompareResult.LT;
    }

    if (verA.buildMetadata !== verB.buildMetadata) {
      return verA.buildMetadata > verB.buildMetadata
        ? VersionCompareResult.GT
        : VersionCompareResult.LT;
    }

    return VersionCompareResult.EQUAL;
  }

  static parse(version: string): Version {
    const v: Version = new Version();
    let stage: 0 | 1 | 2 | 3 | 4 = 0;

    for (const c of version) {
      if (stage === 0 && !v.minorUpdate && !v.patchUpdate) {
        if (c === '~') {
          v.patchUpdate = true;
          continue;
        } else if (c === '^') {
          v.minorUpdate = true;
          continue;
        }
      }
      if (c === '.' && (stage >= 0 && stage < 2)) {
        stage++;
        continue;
      } else if (c === '-' && stage === 2) {
        if (v.major === -1 || v.minor === -1 || v.patch === -1) {
          break;
        }
        stage++;
        continue;
      } else if (c === '+') {
        if (v.major === -1 || v.minor === -1 || v.patch === -1) {
          break;
        } else if (stage >= 2) {
          stage = 4;
          continue;
        } else {
          throw new Error('+ must not be used in versioning!');
        }
      } else if (c === '*' || c === 'x') {
        switch (stage) {
          case 0:
            v.major = -1;
            continue;
          case 1:
            v.minor = -1;
            continue;
          case 2:
            v.patch = -1;
            continue;
          default:
            break;
        }
      } else if (c.match(/\d/)) {
        switch (stage) {
          case 0:
            if (v.major === -1) {
              throw new Error('number must not be used when * exists.');
            }
            v.major = v.major * 10 + Number(c);
            continue;
          case 1:
            if (v.minor === -1) {
              throw new Error('number must not be used when * exists.');
            }
            v.minor = v.minor * 10 + Number(c);
            continue;
          case 2:
            if (v.patch === -1) {
              throw new Error('number must not be used when * exists.');
            }
            v.patch = v.patch * 10 + Number(c);
            continue;
          default:
            break;
        }
      }

      if (stage >= 0 && stage <= 2) {
        throw new Error(`invalid character ${c} in stage ${stage}!`);
      }
      if (!c.match(/[0-9a-zA-Z-.]/)) {
        throw new Error(`invalid character ${c}!`);
      }
      if (stage === 3) {
        v.prereleaseVersion += c;
      } else {
        v.buildMetadata += c;
      }
    }

    return v;
  }

  isTemplate(): boolean {
    return (
      this.major === -1 ||
      this.minor === -1 ||
      this.patch === -1 ||
      this.minorUpdate ||
      this.patchUpdate
    );
  }

  match(v: Version): boolean {
    if (v.isTemplate()) return false;

    if (this.major !== -1 && this.major !== v.major) return false;
    if (this.minor !== -1 && this.minorUpdate && this.minor < v.minor) {
      return false;
    }
    if (this.minor !== -1 && this.minor !== v.minor) return false;
    if (this.patch !== -1 && this.patchUpdate && this.patch < v.patch) {
      return false;
    }
    if (this.patch !== -1 && this.patch !== v.patch) return false;

    return true;
  }

  toString() {
    return `${this.minorUpdate ? '^' : ''}${this.patchUpdate ? '~' : ''}${
      this.major
    }.${this.minor}.${this.patch}-${this.prereleaseVersion}+${
      this.buildMetadata
    }`;
  }
}

/**
 * Check whether version B can be used by verA
 * TODO: test this function
 * @deprecated
 * @param verA
 * @param verB
 */
export function versionMatch(verA: string, verB: string): boolean {
  const aPatch = verA.startsWith('~');
  const aMinor = verA.startsWith('^');
  const aMajor = verA.startsWith('*') || verA.startsWith('x');

  const bTags = verB.split('.').map(str => Number(str));

  if (aMajor) return true;
  if (aMinor) {
    verA = verA.substr(1);
    if (!verA.match(/\d+(?:\.(?:[0-9]+|[*x])+/)) return false;

    const aTags = verA.split('.');
    if (aTags[1].match(/[*x]/)) return true;
    else return Number(aTags[1]) <= bTags[1];
  }
  if (aPatch) {
    if (!verA.match(/\d+\.\d+(?:\.(?:[0-9]+|[*x])+/)) return false;
    const aTags = verA.split('.');
    if (aTags[2].match(/[*x]/)) return true;
    else return Number(aTags[2]) <= bTags[2];
  }

  const aTags = verA.split('.').map(str => Number(str));
  for (const i in bTags) {
    if (aTags[i] !== bTags[i]) return false;
  }
  return true;
}
