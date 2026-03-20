import request from '@/utils/request'
import type { Address, AddressRequest, ProvinceVO, CityVO, DistrictVO } from '@/types/api'

/**
 * 获取当前用户的地址列表
 */
export const getAddressList = (): Promise<Address[]> => {
  return request.get('/api/addresses')
}

/**
 * 获取地址详情
 * @param id 地址ID
 */
export const getAddressById = (id: number): Promise<Address> => {
  return request.get(`/api/addresses/${id}`)
}

/**
 * 创建地址
 * @param data 地址数据
 */
export const createAddress = (data: AddressRequest): Promise<Address> => {
  return request.post('/api/addresses', data)
}

/**
 * 更新地址
 * @param id 地址ID
 * @param data 地址数据
 */
export const updateAddress = (id: number, data: AddressRequest): Promise<Address> => {
  return request.put(`/api/addresses/${id}`, data)
}

/**
 * 删除地址
 * @param id 地址ID
 */
export const deleteAddress = (id: number): Promise<void> => {
  return request.delete(`/api/addresses/${id}`)
}

/**
 * 设置默认地址
 * @param id 地址ID
 */
export const setDefaultAddress = (id: number): Promise<void> => {
  return request.put(`/api/addresses/${id}/default`)
}

/**
 * 获取省份列表
 */
export const getProvinces = (): Promise<ProvinceVO[]> => {
  return request.get('/api/addresses/provinces')
}

/**
 * 获取城市列表
 * @param provinceId 省份ID
 */
export const getCities = (provinceId: number): Promise<CityVO[]> => {
  return request.get('/api/addresses/cities', { params: { provinceId } })
}

/**
 * 获取区县列表
 * @param cityId 城市ID
 */
export const getDistricts = (cityId: number): Promise<DistrictVO[]> => {
  return request.get('/api/addresses/districts', { params: { cityId } })
}
