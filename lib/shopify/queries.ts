export const PRODUCTS_QUERY = `
  query Products($first: Int!, $cursor: String) {
    products(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          productType
          vendor
          status
          featuredImage { url altText }
          totalInventory
          updatedAt
          variants(first: 100) {
            edges {
              node {
                id
                sku
                price
                compareAtPrice
                inventoryQuantity
                availableForSale
                inventoryItem { id }
              }
            }
          }
        }
      }
    }
  }
`;

export const INVENTORY_QUERY = `
  query Inventory($first: Int!, $cursor: String) {
    inventoryItems(first: $first, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          sku
          tracked
          variant {
            id
            sku
            product {
              id
              title
              handle
              featuredImage { url }
            }
          }
          inventoryLevels(first: 10) {
            edges {
              node {
                id
                location { id }
                quantities(names: ["available"]) {
                  name
                  quantity
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const STORE_POLICIES_QUERY = `
  query StorePolicies {
    shop {
      id
      name
      myshopifyDomain
      currencyCode
      primaryDomain { url host }
      shopPolicies {
        id
        title
        body
        type
      }
    }
  }
`;
