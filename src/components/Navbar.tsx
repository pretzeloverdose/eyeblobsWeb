// components/Navbar.tsx
import Link from 'next/link';
import styles from './Navbar.module.css';
import { TipsLink } from './TipsLink';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/">Upload</Link>
      <Link href="/page2">Lightbox</Link>
      
      <Link href="/page4">Grid</Link>
      <Link href="/page3">Edit</Link>
      <TipsLink />
    </nav>
  );
}