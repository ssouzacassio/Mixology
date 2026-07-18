import Image from "next/image";

export default function IconeMesa() {
  return (
    <Image
      src="/icones/mesa-redonda.png"
      alt=""
      width={128}
      height={128}
      className="w-6 h-6 opacity-40 dark:invert dark:opacity-40"
    />
  );
}
