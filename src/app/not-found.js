// app/global-not-found.js
import NoPrefetchLink from './NoPrefetchLink';

export default function GlobalNotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <NoPrefetchLink href="/">Return to Homepage</NoPrefetchLink>
    </div>
  );
}