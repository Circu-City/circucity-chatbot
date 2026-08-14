import prisma from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface CartPageProps {
  searchParams: Promise<{ sessionId?: string; storeId?: string }>;
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const params = await searchParams;
  const sessionId = params.sessionId;
  const storeId = params.storeId;

  if (!sessionId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", padding: "40px 20px", background: "#f8fafc" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>Shopping Cart</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>Your cart is empty or you need to start a chat first.</p>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const items = await prisma.cartItem.findMany({
    where: { sessionId, ...(storeId ? { storeId } : {}) },
    orderBy: { createdAt: "asc" },
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number, currency: string) => {
    const sym = currency === "SEK" ? "kr" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
    return `${price.toFixed(2)} ${sym}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Shopping Cart</h1>
          <Link href="/" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", transition: "background .2s" }}>&larr; Back</Link>
        </div>

        {items.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 16, color: "#64748b", margin: "0 0 16px" }}>Your cart is empty.</p>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 24px" }}>Ask the chatbot to add products to your cart!</p>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Continue Shopping</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12, fontSize: 14, color: "#64748b" }}>
              {count} {count === 1 ? "item" : "items"} &middot; Total: <strong style={{ color: "#0f172a" }}>{formatPrice(total, "SEK")}</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f1f5f9", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 24 }}>📦</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      Qty: {item.quantity} &middot; {formatPrice(item.price * item.quantity, item.currency)}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                    {item.quantity > 1 ? `${formatPrice(item.price, item.currency)} ea` : formatPrice(item.price, item.currency)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
                <span>Total</span>
                <span>{formatPrice(total, "SEK")}</span>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
                Free shipping on orders over 500 SEK
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Link href="/" style={{ flex: 1, textAlign: "center", padding: "14px 20px", borderRadius: 12, border: "1px solid #e2e8f0", color: "#0f172a", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "background .2s" }}>
                  Continue Shopping
                </Link>
                <a href="https://circucity.com/cart" target="_blank" rel="noopener" style={{ flex: 1, textAlign: "center", padding: "14px 20px", borderRadius: 12, background: "#0f172a", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "background .2s" }}>
                  Proceed to Checkout
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}