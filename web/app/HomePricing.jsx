'use client'

function subscriptionSavings(plan, monthlyPrice) {
  const regularPrice = monthlyPrice * plan.months
  return plan.price && regularPrice > 0
    ? Math.round((1 - Number(plan.price) / regularPrice) * 100)
    : 0
}

function planTitle(months) {
  if (months === 12) return '1 year'
  if (months === 1) return '1 month'
  return `${months} months`
}

/** Homepage pricing — published staff plans only (no preview/stub prices). */
export function HomePricing({ plans, onSelect }) {
  const offers = plans?.plans?.filter((plan) => plan.price) ?? []
  const monthlyPrice = Number(offers.find((plan) => plan.months === 1)?.price)

  if (!offers.length) {
    return (
      <section className="mx-auto my-8 w-full max-w-5xl px-4 sm:px-6" aria-labelledby="home-pricing-title">
        <header className="mb-4 text-center">
          <h2 id="home-pricing-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B4332]">
            Subscription pricing
          </h2>
          <p className="mt-2 text-sm text-[#6E695F]">
            Prices appear here once staff publish plan amounts and bank instructions.
          </p>
        </header>
      </section>
    )
  }

  return (
    <section className="mx-auto my-8 w-full max-w-5xl px-4 sm:px-6" aria-labelledby="home-pricing-title">
      <header className="mb-6 text-center">
        <h2 id="home-pricing-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B4332]">
          Subscription pricing
        </h2>
        <p className="mt-2 text-sm text-[#6E695F]">
          Unlock paid tender details and vehicle bidding instructions.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {offers.map((plan) => {
          const recommended = plan.months === 6
          const savings = subscriptionSavings(plan, monthlyPrice)
          const title = planTitle(plan.months)
          return (
            <article
              key={plan.months}
              className={`relative flex flex-col items-stretch overflow-hidden rounded-2xl border bg-white px-4 pb-5 pt-12 text-center ${
                recommended ? 'border-[#1B4332] shadow-sm' : 'border-[#E5DFD5]'
              }`}
            >
              {recommended ? (
                <div className="absolute inset-x-0 top-0 bg-[#1B4332] px-2 py-2 text-xs font-extrabold text-white">
                  Recommended
                </div>
              ) : null}
              <h3 className="text-sm font-bold text-[#16201B]">{title}</h3>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#1B4332]">
                {Number(plan.price).toLocaleString('en-ET')} birr
              </p>
              <p className="mb-3 min-h-6 text-xs text-[#6E695F]">
                {savings > 0 ? (
                  <span className="inline-block rounded-md bg-[#EAF7EE] px-2 py-0.5 font-bold text-[#1B4332]">
                    Save {savings}%
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                className={`w-full rounded-lg px-3 py-2.5 text-xs font-bold ${
                  recommended
                    ? 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
                    : 'border border-[#E5DFD5] bg-[#FAF8F5] text-[#1B4332] hover:bg-[#EAF7EE]'
                }`}
                onClick={() => onSelect(plan.months)}
                aria-label={`View ${title} plan`}
              >
                View plan
              </button>
              <ul className="mt-4 grid gap-2 text-left text-[11px] text-[#6E695F]">
                <li className="flex gap-2"><span className="font-extrabold text-[#1B4332]">✓</span> Access paid tender details</li>
                <li className="flex gap-2"><span className="font-extrabold text-[#1B4332]">✓</span> View vehicle bidding instructions</li>
                <li className="flex gap-2"><span className="font-extrabold text-[#1B4332]">✓</span> Save tenders to revisit</li>
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}
