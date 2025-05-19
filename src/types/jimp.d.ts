declare module "jimp" {
  namespace Jimp {
    interface Jimp {
      getWidth(): number;
      getHeight(): number;
      getPixelColor(x: number, y: number): number;
    }

    function intToRGBA(color: number): {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    function read(path: string): Promise<Jimp>;
  }

  function Jimp(...args: any[]): Promise<Jimp.Jimp>;

  namespace Jimp {
    export function read(path: string): Promise<Jimp.Jimp>;
  }

  export = Jimp;
}
