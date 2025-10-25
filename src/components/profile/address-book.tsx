'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useMutation } from '@/hooks/useApi';
import { addressSchema, AddressInput } from '@/lib/validations';
import { AuthUser } from '@/types';

interface AddressBookProps {
  user: AuthUser;
}

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  region: string;
  zipCode: string;
  phone?: string;
  isMain: boolean;
}

export const AddressBook: React.FC<AddressBookProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      name: 'Домашний адрес',
      street: 'ул. Примерная, д. 123, кв. 45',
      city: 'Москва',
      region: 'Московская область',
      zipCode: '123456',
      phone: '+7 (495) 123-45-67',
      isMain: true,
    },
    {
      id: '2',
      name: 'Офис',
      street: 'ул. Рабочая, д. 456, оф. 78',
      city: 'Москва',
      region: 'Московская область',
      zipCode: '654321',
      phone: '+7 (495) 987-65-43',
      isMain: false,
    },
  ]);

  const { success, error } = useToast();
  const { mutate: saveAddress, loading } = useMutation('/api/users/addresses', 'POST');
  const { mutate: updateAddress } = useMutation('/api/users/addresses', 'PUT');
  const { mutate: deleteAddress } = useMutation('/api/users/addresses', 'DELETE');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
  });

  const openModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      reset(address);
    } else {
      setEditingAddress(null);
      reset({
        name: '',
        street: '',
        city: '',
        region: '',
        zipCode: '',
        phone: '',
        isMain: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    reset();
  };

  const onSubmit = async (data: AddressInput) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress({ ...data, id: editingAddress.id });
        setAddresses(prev => 
          prev.map(addr => 
            addr.id === editingAddress.id ? { ...addr, ...data } : addr
          )
        );
        success('Адрес обновлён', 'Изменения успешно сохранены');
      } else {
        // Create new address
        const newAddress = { ...data, id: Date.now().toString() };
        await saveAddress(data);
        setAddresses(prev => [...prev, newAddress]);
        success('Адрес добавлен', 'Новый адрес успешно сохранён');
      }
      closeModal();
    } catch (err) {
      error('Ошибка сохранения', 'Не удалось сохранить адрес');
    }
  };

  const handleDelete = async (addressId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот адрес?')) {
      try {
        await deleteAddress({ id: addressId });
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
        success('Адрес удалён', 'Адрес успешно удалён');
      } catch (err) {
        error('Ошибка удаления', 'Не удалось удалить адрес');
      }
    }
  };

  const handleSetMain = async (addressId: string) => {
    try {
      await updateAddress({ id: addressId, isMain: true });
      setAddresses(prev => 
        prev.map(addr => ({ ...addr, isMain: addr.id === addressId }))
      );
      success('Основной адрес изменён', 'Адрес установлен как основной');
    } catch (err) {
      error('Ошибка обновления', 'Не удалось установить основной адрес');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Адресная книга</h2>
        <Button
          onClick={() => openModal()}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить адрес</span>
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Адресов пока нет
          </h3>
          <p className="text-gray-600 mb-6">
            Добавьте адрес для быстрого оформления заказов
          </p>
          <Button onClick={() => openModal()}>
            Добавить первый адрес
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {address.name}
                  </h3>
                  {address.isMain && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>{address.street}</p>
                <p>{address.city}, {address.region}</p>
                <p>Индекс: {address.zipCode}</p>
                {address.phone && <p>Телефон: {address.phone}</p>}
              </div>

              {!address.isMain && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetMain(address.id)}
                  className="mt-4"
                >
                  Сделать основным
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAddress ? 'Редактировать адрес' : 'Добавить адрес'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Название адреса"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Домашний адрес, Офис, etc."
          />

          <Input
            label="Улица, дом, квартира"
            {...register('street')}
            error={errors.street?.message}
            placeholder="ул. Примерная, д. 123, кв. 45"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Город"
              {...register('city')}
              error={errors.city?.message}
              placeholder="Москва"
            />
            <Input
              label="Регион"
              {...register('region')}
              error={errors.region?.message}
              placeholder="Московская область"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Почтовый индекс"
              {...register('zipCode')}
              error={errors.zipCode?.message}
              placeholder="123456"
            />
            <Input
              label="Телефон"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+7 (___) ___-__-__"
              helperText="Необязательно"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isMain')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label className="ml-2 text-sm text-gray-600">
              Сделать основным адресом
            </label>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" loading={loading} className="flex-1">
              {editingAddress ? 'Сохранить' : 'Добавить'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


