
class WishlistCard extends HTMLElement {

    connectedCallback() {

        if (!this.product) {
            return salla.logger.warn('custom-wishlist-card:: product does not exist!');
        }
        salla.onReady(() => this.render())

    }

    render() {
        this.setAttribute('id', `wishlist-product-${this.product.id}`)
        this.classList.add('product-entry', 'product-entry--wishlist')

        this.innerHTML = `
        <div class="flex items-center mb-4 sm:mb-0">
          <a href="${this.product.url}" class="product-entry__image">
            <img class="object-cover w-full h-full" src="${this.product.image.url}" loading="lazy" alt="${this.product.image.alt}" />
          </a>
          <div class="flex-1 rtl:pr-5 ltr:pl-5">
            <h3 class="text-sm text-gray-800 leading-6 mb-1.5 rtl:pl-5 ltr:pr-5 rtl:md:pl-8 ltr:md:pr-8 line-clamp-1">
              <a href="${this.product.url}">${this.product.name}</a>
            </h3>
          </div>
        </div>
        <div class="flex items-center space-x-4 rtl:space-x-reverse">
          <a class="et-whatsapp-button et-whatsapp-button--card flex-grow w-full sm:grow-0 md:w-48"
            data-et-booking
            data-name="${String(this.product.name).replace(/"/g, '&quot;')}"
            data-url="${this.product.url}"
            href="https://wa.me/${String(window.et_whatsapp || '').replace(/\D/g, '')}"
            target="_blank"
            rel="noopener">
            <i class="text-base sicon-whatsapp" aria-hidden="true"></i>
            <span>احجز عبر واتساب</span>
          </a>
          <salla-button loader-position="center" shape="icon" size="small" color="danger" class="btn--delete" onclick="salla.wishlist.remove(${this.product.id})">
            <i class="sicon-cancel"></i>
          </salla-button>
        </div>
  `

    }
}

customElements.define('custom-wishlist-card', WishlistCard);
