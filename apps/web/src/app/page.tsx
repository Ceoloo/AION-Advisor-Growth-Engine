import { redirect } from 'next/navigation';

export default function Home() {
  // The MVP boots straight into the demo dashboard. A real deployment would
  // check the session here and route to /login when unauthenticated.
  redirect('/dashboard');
}
