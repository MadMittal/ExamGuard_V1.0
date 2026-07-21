import { redirect } from 'next/navigation';

// Root page redirects to the student exam portal
export default function Home() {
  redirect('/exam');
}
