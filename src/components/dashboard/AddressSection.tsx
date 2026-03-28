import React from 'react';
import { UserAddresses } from '../../pages/UserAddresses';

export const AddressSection: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Addresses</h2>
      <UserAddresses />
    </div>
  );
};