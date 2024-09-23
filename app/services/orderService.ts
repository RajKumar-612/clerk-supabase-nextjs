import useClerkSupabaseClient from '../hooks/useClerkSupabaseClient';

export const useOrderService = () => {
    const supabase = useClerkSupabaseClient();

    const createOrder = async (orderData: any) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData]);

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error("Error creating order:", error);
            throw new Error("Failed to create order");
        }
    };

    return { createOrder };
};