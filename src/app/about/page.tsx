import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Bufer Feast" };

const values = [
  ["Trust comes first.", "Good food and honest dealing build lasting customers."],
  ["Cooks deserve fair treatment.", "Their skill is the heart of every celebration."],
  ["Clear beats complicated.", "Prices, dates, and terms should be easy to understand."],
  ["Every table matters.", "Whether you are feeding 10 people or 100."],
];

export default function About() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-[#333] bg-[#111] p-7 shadow-2xl sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#FF5500]">About Bufer Feast</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Food for every table.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#c6c6c6]">
            Bufer Feast is an online marketplace that connects people who need food in bulk with cooks who prepare it well.
            Whether it is a personal meal, wedding, naming ceremony, birthday, funeral, office lunch, or family gathering,
            we help you find the right cook, place your order, and get your food on the day you need it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kitchens" className="rounded-xl bg-[#FF5500] px-5 py-3 font-bold text-white transition hover:bg-[#e64d00]">Find food</Link>
            <Link href="/signup" className="rounded-xl border border-[#555] px-5 py-3 font-bold text-white transition hover:border-[#FF5500]">Join as a cook</Link>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-[#333] bg-[#111] p-7">
            <h2 className="text-2xl font-bold">Why we exist</h2>
            <p className="mt-4 leading-7 text-[#b5b5b5]">
              Ordering food for a crowd should not be a gamble. Buyers should not have to depend on scattered chats,
              uncertain referrals, or deposits to people they barely know. Talented cooks also deserve a way to reach more
              customers without spending all their time chasing payments. Bufer Feast is designed to help both sides.
            </p>
          </section>

          <section className="rounded-2xl border border-[#333] bg-[#111] p-7">
            <h2 className="text-2xl font-bold">How it works</h2>
            <p className="mt-4 leading-7 text-[#b5b5b5]">
              Buyers browse cooks by category, choose a quantity and date, and order in one place. Cooks receive organized
              orders and can serve customers beyond their own circle. We aim to protect both sides of every order.
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-[#333] bg-[#111] p-7 sm:p-9">
          <h2 className="text-2xl font-bold">What we believe</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {values.map(([title, description]) => (
              <div key={title} className="rounded-xl border border-[#333] bg-[#171717] p-5">
                <h3 className="font-bold text-[#FF7A3D]">{title}</h3>
                <p className="mt-2 leading-6 text-[#b5b5b5]">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#FF5500]/30 bg-[#1b120d] p-7 sm:p-9">
          <h2 className="text-2xl font-bold">Need help?</h2>
          <p className="mt-3 leading-7 text-[#d5c2b8]">Our support team is available every day from 8am to 9pm.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
            <a href="https://wa.me/2349131246555" target="_blank" rel="noreferrer" className="rounded-lg bg-[#25D366] px-4 py-3 text-black">WhatsApp: +234 913 124 6555</a>
            <a href="mailto:buferfeast@gmail.com" className="rounded-lg border border-[#755] px-4 py-3 text-white">buferfeast@gmail.com</a>
            <Link href="/support" className="rounded-lg border border-[#755] px-4 py-3 text-white">Contact support</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
