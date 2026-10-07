import type { Metadata } from "next";
import { prisma } from "@/lib/server/db";
import { EyeTestBooking } from "@/components/stores/EyeTestBooking";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Eye test and stores" };

export default async function StoresPage() {
  const stores = await prisma.storeLocation.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] });
  return (
    <div className="page pb-16 pt-10 md:pt-14">
      <p className="eyebrow">Free, about 20 minutes, no purchase needed</p>
      <h1 className="mt-2 font-display text-5xl">Eye test &amp; stores</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">Not sure of your power, or want help with fit? Visit a store. An optometrist checks your eyes and helps you choose a size.</p>
      <div className="grid-page mt-10 gap-y-10">
        <div className="col-span-4 md:col-span-8 xl:col-span-5">
          <EyeTestBooking stores={stores} />
        </div>
        <section id="store-list" aria-labelledby="stores-title" className="col-span-4 md:col-span-8 xl:col-span-7">
          <h2 id="stores-title" className="font-display text-3xl">All stores</h2>
          <p className="mt-1 text-sm text-muted">Store names and addresses are invented for this concept.</p>
          <ul className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
            {stores.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 bg-paper p-4">
                <p className="eyebrow">{s.city}</p>
                <h3 className="font-sans text-lg font-bold">{s.name}</h3>
                <p className="text-sm text-muted">{s.address}</p>
                <p className="flex items-center gap-2 text-sm"><Icon name="timer" size={16} className="text-accent" /> {s.hours}</p>
                <p className={`flex items-center gap-2 text-sm font-semibold ${s.eyeTest ? "text-success" : "text-muted"}`}>
                  <Icon name={s.eyeTest ? "eye" : "info"} size={16} /> {s.eyeTest ? "Free eye tests available" : "No eye tests at this store"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
