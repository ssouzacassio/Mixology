import Image from "next/image";

export default function IconeNavMenu({ size = 18 }: { size?: number; strokeWidth?: number }) {
  return (
    <Image
      src="/icones/menu.png"
      alt=""
      width={64}
      height={64}
      style={{ width: size, height: size }}
      className="dark:invert shrink-0"
    />
  );
}
