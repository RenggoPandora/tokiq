import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoriesService, productsService, type ProductFilters } from '@/services/products.service'
import { useTenant } from '@/hooks/use-tenant'
import type { CreateCategory, CreateProduct, UpdateCategory, UpdateProduct } from '@/types/app.types'

// ===========================
// QUERY KEYS
// ===========================

export const categoryKeys = {
  all: ['categories'] as const,
  list: (tenantId: string) => [...categoryKeys.all, tenantId] as const,
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (tenantId: string, filters?: ProductFilters) =>
    [...productKeys.lists(), tenantId, filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

// ===========================
// CATEGORIES
// ===========================

export function useCategories() {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: categoryKeys.list(tenantId),
    queryFn: () => categoriesService.getAll(tenantId),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (dto: Omit<CreateCategory, 'tenant_id'>) =>
      categoriesService.create({ ...dto, tenant_id: tenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(tenantId) })
      toast.success('Kategori berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategory }) =>
      categoriesService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(tenantId) })
      toast.success('Kategori berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list(tenantId) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Kategori berhasil dihapus')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

// ===========================
// PRODUCTS
// ===========================

export function useProducts(filters?: ProductFilters) {
  const { tenantId } = useTenant()
  return useQuery({
    queryKey: productKeys.list(tenantId, filters),
    queryFn: () => productsService.getAll(tenantId, filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { tenantId } = useTenant()
  return useMutation({
    mutationFn: (dto: Omit<CreateProduct, 'tenant_id'>) =>
      productsService.create({ ...dto, tenant_id: tenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Produk berhasil ditambahkan')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProduct }) =>
      productsService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(data.id) })
      toast.success('Produk berhasil diperbarui')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useToggleProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productsService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Produk berhasil dihapus')
    },
    onError: (err: Error) => toast.error(`Gagal: ${err.message}`),
  })
}
