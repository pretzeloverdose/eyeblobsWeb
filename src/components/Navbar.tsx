import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/">Upload</Link>
      <Link href="/page2">Lightbox</Link>
      <Link href="/page3">Edit</Link>
    </nav>
  );
}