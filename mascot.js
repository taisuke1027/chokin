/**
 * mascot.js — キャラクター「しばまる」の顔アイコン一覧
 * 表情ごとのファイルパスを管理し、複数の画面から再利用できるようにする。
 */
const MASCOT_FACES = [
  { key: "normal", file: "mascot-normal.png" },
  { key: "joy", file: "mascot-joy.png" },
  { key: "motivated", file: "mascot-motivated.png" },
  { key: "tehepero", file: "mascot-tehepero.png" },
];

function randomMascotFace() {
  return MASCOT_FACES[Math.floor(Math.random() * MASCOT_FACES.length)];
}

/**
 * 記録結果画面（積み立て完了）用の全身ポーズ画像。
 * ジャンプ（喜び）とガッツポーズの2種類を、記録するたびに交互に表示する。
 */
const MASCOT_BODIES = [
  { key: "jump", file: "mascot-body-jump.png" },
  { key: "guts", file: "mascot-body-guts.png" },
];

/** 前回表示したものの次を返す（ランダムではなく交互表示）。端末に記憶される。 */
function nextMascotBody() {
  const lastIndex = Storage.getLastMascotBodyIndex();
  const nextIndex = (lastIndex + 1) % MASCOT_BODIES.length;
  Storage.setLastMascotBodyIndex(nextIndex);
  return MASCOT_BODIES[nextIndex];
}
