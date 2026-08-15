import './globals.css';
import FacebookSDK from "@/components/FacebookSDK";
import Translator from "@/components/Translator";
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'CircuCity AI | Personalized AI Customer Support',
  description: 'Empower your online store with a personalized AI customer support agent.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`} suppressHydrationWarning><script dangerouslySetInnerHTML={{__html:`(function(){var d=document.documentElement;if(d.hasAttribute)for(var a=d.attributes,i=a.length-1;i>=0;i--){var n=a[i].name;if(n!=="lang"&&n!=="class"&&n.indexOf("data-")===0)d.removeAttribute(n)}})`}} /><FacebookSDK />
        <Translator />
        {children}</body>
    </html>
  );
}
