// app/global-not-found.js
import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">Return to Homepage</Link>
    </div>
  );
}