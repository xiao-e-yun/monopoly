export function shuffle(array: unknown[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

export const randomGet = <T>(source: T[]): () => T => {
  let list = source.slice()
  
  return () => {
    if (!list.length) list = source.slice()
    return list.splice(Math.floor(Math.random() * list.length),1)[0]
  }
}