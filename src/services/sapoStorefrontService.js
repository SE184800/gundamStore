import axios from 'axios';

const SAPO_ENDPOINT = import.meta.env.VITE_APP_SAPO_STOREFRONT_ENDPOINT;

export const getSapoStorefrontProducts = async (limit = 50) => {
  try {
    // Gọi dạng GET chuẩn REST, không cần truyền headers phức tạp nữa vì Proxy đã lo
    const response = await axios.get(SAPO_ENDPOINT, {
      params: { limit: limit }
    });

    const products = response.data?.products || [];

    // Khớp dữ liệu từ Sapo Admin về đúng các trường mà giao diện của cậu đang cần
    return products.map(prod => {
      const firstVariant = prod.variants?.[0] || {};
      const firstImage = prod.images?.[0]?.src || '';

      return {
        id: prod.id.toString(),
        title: prod.name,          // Tên sản phẩm
        handle: prod.alias,        // Đường dẫn slug
        images: {
          edges: [{ node: { src: firstImage || 'https://via.placeholder.com/300' } }]
        },
        variants: {
          edges: [{
            node: {
              sku: firstVariant.sku || prod.alias,
              price: firstVariant.price || 0,
              compareAtPrice: firstVariant.compare_at_price || 0,
              availableForSale: firstVariant.inventory_quantity > 0
            }
          }]
        }
      };
    });
  } catch (error) {
    console.error("❌ Lỗi lấy data khẩn cấp từ Sapo Admin:", error);
    return []; // Trả về mảng rỗng để giao diện không bị sập nếu lỗi
  }
};