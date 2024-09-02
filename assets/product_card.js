class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.product_handle = this.dataset.handle;
        this.currency = this.dataset.shopCurrency;
        this.submitForm = this.querySelector('.form');
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.selectedVariant = null;


        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

    }

    connectedCallback() {
        this.loadProductData();

        if (this.submitForm) {
            this.submitForm.addEventListener('submit', this.handleSubmit.bind(this));
        }

        this.onVariantChangeUnsubscriber = subscribe(
            PUB_SUB_EVENTS.optionValueSelectionChange,
            this.handleOptionValueChange.bind(this)
        );
    }

    loadProductData() {
        fetch(`${window.Shopify.routes.root}products/${this.product_handle}.js`)
            .then(response => response.json())
            .then(product => {
                this.product = product;
                this.selectedVariant = product.variants[0];
                this.updatePrice(this.selectedVariant);
                this.updateFormVariant(this.selectedVariant.id);
            })
            .catch(error => {
                console.error('Error fetching product data:', error);
            });
    }

    handleOptionValueChange({ data: { selectedOptions } }) {
        if (!this.product) {
            console.error('Product data not loaded');
            return;
        }

        const newVariant = this.findVariantByOptions(this.product, selectedOptions);

        if (newVariant) {
            this.selectedVariant = newVariant;
            this.updatePrice(this.selectedVariant);
            this.updateFormVariant(this.selectedVariant.id);
        } else {
            console.log('No matching variant found.');
        }
    }

    updatePrice(variant) {
        const salePriceElement = this.querySelector('.sale_price');
        const oldPriceElement = this.querySelector('.old_price');

        if (salePriceElement) {
            salePriceElement.textContent = this.formatMoney(variant.price);
        }

        if (oldPriceElement) {
            if (variant.compare_at_price > variant.price) {
                oldPriceElement.textContent = this.formatMoney(variant.compare_at_price);
                oldPriceElement.style.display = 'inline';
            } else {
                oldPriceElement.style.display = 'none';
            }
        }
    }

    updateFormVariant(variantId) {
        const variantInput = this.submitForm.querySelector('input[name="id"]');
        if (variantInput) {
            variantInput.value = variantId;
        }
    }

    formatMoney(amount) {
        return `${this.formatCurrency(amount)} ${this.currency}`;
    }

    formatCurrency(amount) {
        return (amount / 100).toFixed(2); 
    }

    findVariantByOptions(product, selectedOptions) {
        return product.variants.find(variant => {
            const variantOptions = variant.options;
            return selectedOptions.every(option => variantOptions.includes(option));
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        if (!this.selectedVariant) {
            console.error('No variant selected');
            return;
        }

        const formData = {
            items: [{
                id: this.selectedVariant.id,
                quantity: 1,
                sections: ["cart-icon-bubble", "cart-notification"], 
                sections_url: window.location.pathname
            }]
        };

        fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Product added to cart:', data);
            this.updateCartUI(data.sections);
        })
        .catch(error => {
            console.error('Error adding product to cart:', error);
        });
    }

    updateCartUI() {
        fetch(`${window.Shopify.routes.root}?sections=cart-icon-bubble,cart-notification`)
            .then(response => response.json())
            .then(data => {
                if (data['cart-icon-bubble']) {
                    document.querySelector('#cart-icon-bubble').innerHTML = data['cart-icon-bubble'];
                } else {
                    console.error('Error: cart-icon-bubble section is missing in the response');
                }

            })
            .catch(error => {
                console.error('Error updating cart UI:', error);
            });
    }

    disconnectedCallback() {
        if (this.onVariantChangeUnsubscriber) {
            this.onVariantChangeUnsubscriber();
        }
    }
}

customElements.define("product-card", ProductCard);
