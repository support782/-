import axios from 'axios';

export const sendSMS = async (to: string, message: string, sandbox: boolean = false) => {
  try {
    const response = await axios.post('/api/sms/send', { to, message, sandbox });
    return response.data;
  } catch (error) {
    console.error('SMS API Error:', error);
    throw error;
  }
};

export const initiatePayment = async (amount: number, purpose: string) => {
  try {
    const response = await axios.post('/api/payment/initiate', { amount, purpose });
    return response.data;
  } catch (error) {
    console.error('Payment API Error:', error);
    throw error;
  }
};
