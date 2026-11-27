import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Producer, Product, Order, ReviewItem, ProducerStory, StoryComment, ChatMessage, AppUser, SealItem, CategoryDef, AppFeedback } from '../types';
import { StorageService, buildProducerFromUser, reconcileProducersWithUsers } from './storage';

// Obtém as variáveis de ambiente Vite (ou vazias se ainda não configuradas pelo usuário)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    !supabaseUrl.includes('seu-projeto')
  );
};

// Cliente Supabase instanciado caso as credenciais estejam disponíveis
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// 1. SERVIÇO DE AUTENTICAÇÃO E PERFIS
// ==============================================================================
export const authService = {
  async signUp(email: string, password: string, userData: Partial<AppUser>) {
    if (!supabase) {
      const newUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        name: userData.name || email.split('@')[0],
        role: userData.role || 'consumer',
        city: userData.city || 'Queimados',
        neighborhood: userData.neighborhood || 'Centro',
        phone: userData.phone || '',
        verified: true,
        createdAt: new Date().toISOString(),
        producerId: userData.producerId,
        farmId: userData.farmId,
        farmName: userData.farmName,
        avatar: userData.avatar || '',
        avatarBgColor: userData.avatarBgColor || '#4E553D',
      };
      StorageService.saveUser(newUser);
      StorageService.setCurrentUser(newUser);
      return { user: newUser, error: null, emailSent: false };
    }

    try {
      const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            name: userData.name,
            role: userData.role || 'consumer',
            phone: userData.phone,
            city: userData.city || 'Queimados',
            neighborhood: userData.neighborhood,
            avatar: userData.avatar,
          }
        }
      });

      if (error) return { user: null, error: error.message, emailSent: false };

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        return { user: profile || data.user, error: null, emailSent: true };
      }
      return { user: null, error: 'Erro inesperado no cadastro', emailSent: false };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erro de conexão', emailSent: false };
    }
  },

  async signIn(email: string, password: string) {
    if (!supabase) {
      const users = StorageService.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        StorageService.setCurrentUser(user);
        return { user, error: null };
      }
      return { user: null, error: 'Credenciais inválidas ou usuário não encontrado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { user: null, error: error.message };

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          StorageService.setCurrentUser(profile as AppUser);
          return { user: profile, error: null };
        }
      }
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Erro de conexão' };
    }
  },

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    StorageService.logout();
  },

  async getCurrentSessionUser(): Promise<AppUser | null> {
    if (!supabase) {
      return StorageService.getCurrentUser();
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return StorageService.getCurrentUser();
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      return (profile as AppUser) || null;
    } catch {
      return StorageService.getCurrentUser();
    }
  },

  async updateUserCredentials(
    user: AppUser,
    updates: { email?: string; phone?: string; password?: string }
  ): Promise<{ success: boolean; user: AppUser; error?: string; emailConfirmationPending?: boolean }> {
    const nextEmail = updates.email !== undefined ? updates.email.trim().toLowerCase() : user.email;
    const nextPhone = updates.phone !== undefined ? updates.phone.trim() : user.phone;
    const nextPassword = updates.password ? updates.password : user.password;

    const updatedUser: AppUser = {
      ...user,
      email: nextEmail,
      phone: nextPhone,
      password: nextPassword,
    };

    let emailConfirmationPending = false;

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authPayload: { email?: string; password?: string; data?: Record<string, any> } = {};
          if (updates.email && nextEmail !== (user.email || '').toLowerCase()) {
            authPayload.email = nextEmail;
            emailConfirmationPending = true;
          }
          if (updates.password) {
            authPayload.password = updates.password;
          }
          if (updates.phone !== undefined) {
            authPayload.data = { phone: nextPhone };
          }

          if (authPayload.email || authPayload.password || authPayload.data) {
            const { error: authError } = await supabase.auth.updateUser(authPayload);
            if (authError) {
              return { success: false, user, error: authError.message };
            }
          }

          await supabase
            .from('profiles')
            .update({
              email: nextEmail,
              phone: nextPhone,
            })
            .eq('id', session.user.id);
        }
      } catch (err: any) {
        return { success: false, user, error: err?.message || 'Erro ao atualizar dados da conta' };
      }
    }

    // Persist locally and sync Express backend
    StorageService.saveUser(updatedUser);
    StorageService.setCurrentUser(updatedUser);

    // Sync phone/whatsapp to Producer record if user is a seller
    if (updatedUser.role === 'producer' && updates.phone !== undefined) {
      const targetProducerId = updatedUser.producerId || updatedUser.farmId || `prod_${updatedUser.id}`;
      const existingProducer = StorageService.getProducers().find(
        (p) => p.id === targetProducerId || p.id === updatedUser.id
      );
      if (existingProducer) {
        const numericPhone = nextPhone.replace(/\D/g, '');
        const whatsapp = numericPhone
          ? numericPhone.startsWith('55')
            ? numericPhone
            : `55${numericPhone}`
          : '';
        await producersService.update(existingProducer.id, {
          phone: nextPhone,
          whatsapp,
        });
      }
    }

    return { success: true, user: updatedUser, emailConfirmationPending };
  },

  async deleteUserAccount(user: AppUser): Promise<{ success: boolean }> {
    StorageService.deleteUser(user.id);

    if (supabase) {
      try {
        if (user.role === 'producer') {
          const targetProducerId = user.producerId || user.farmId || `prod_${user.id}`;
          await supabase.from('products').delete().eq('producer_id', targetProducerId);
          await supabase.from('producers').delete().eq('id', targetProducerId);
        }
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase account cleanup warning:', err);
      }
    }

    return { success: true };
  }
};

// ==============================================================================
// 2. SERVIÇO DE PRODUTORES (EMPREENDEDORES)
// ==============================================================================
export const producersService = {
  async getAll(): Promise<Producer[]> {
    const fakeIds = new Set(['prod_vivian', 'prod_leo']);
    const localProducers = StorageService.getProducers();
    const localUsers = StorageService.getUsers();
    let merged: Producer[] = [...localProducers];
    let remoteUsers: AppUser[] = [...localUsers];

    // Always try Express backend API as shared fallback
    try {
      const [prodResp, userResp] = await Promise.all([
        fetch('/api/producers').catch(() => null),
        fetch('/api/users').catch(() => null),
      ]);
      if (prodResp && prodResp.ok) {
        const apiProducers = await prodResp.json();
        if (Array.isArray(apiProducers)) {
          const map = new Map<string, Producer>();
          for (const p of merged) map.set(p.id, p);
          for (const p of apiProducers) {
            if (p?.id && !fakeIds.has(p.id)) map.set(p.id, p);
          }
          merged = Array.from(map.values());
        }
      }
      if (userResp && userResp.ok) {
        const apiUsers = await userResp.json();
        if (Array.isArray(apiUsers)) {
          const uMap = new Map<string, AppUser>();
          for (const u of remoteUsers) uMap.set(u.id, u);
          for (const u of apiUsers) {
            if (u?.id) uMap.set(u.id, u);
          }
          remoteUsers = Array.from(uMap.values());
        }
      }
    } catch {
      // ignore if backend API unavailable (e.g., static deploy)
    }

    if (supabase) {
      try {
        const [{ data: supaProducers }, { data: supaProfiles }] = await Promise.all([
          supabase.from('producers').select('*').order('name'),
          supabase.from('profiles').select('*').eq('role', 'producer'),
        ]);

        const map = new Map<string, Producer>();
        for (const p of merged) {
          if (p?.id && !fakeIds.has(p.id)) map.set(p.id, p);
        }

        if (Array.isArray(supaProducers)) {
          for (const item of supaProducers) {
            if (!item?.id || fakeIds.has(item.id)) continue;
            map.set(item.id, {
              id: item.id,
              name: item.name,
              farmName: item.farm_name,
              tagline: item.tagline || '',
              bio: item.bio || '',
              story: item.story || '',
              avatar: item.avatar || '',
              avatarBgColor: item.avatar_bg_color || '#4E553D',
              coverImage: item.cover_image || '',
              coverBgColor: item.cover_bg_color || '#1F6B38',
              galleryImages: item.gallery_images || [],
              location: {
                city: item.city || 'Queimados',
                state: item.state || 'RJ',
                neighborhood: item.neighborhood || '',
                address: item.address || '',
                distanceKm: Number(item.distance_km || 0),
                lat: item.lat,
                lng: item.lng,
              },
              rating: Number(item.rating || 0),
              reviewCount: Number(item.review_count || 0),
              certifications: item.certifications || [],
              phone: item.phone || '',
              whatsapp: item.whatsapp || '',
              establishedYear: item.established_year || new Date().getFullYear(),
              harvestDays: item.harvest_days || [],
              deliveryMethods: item.delivery_methods || [],
              hectares: item.hectares ? Number(item.hectares) : undefined,
              specialty: item.specialty || '',
              viewsCount: item.views_count || 0,
              category: item.category,
            });
          }
        }

        if (Array.isArray(supaProfiles)) {
          for (const prof of supaProfiles) {
            if (!prof?.id) continue;
            const existsForProfile = Array.from(map.values()).some(
              (p) =>
                p.id === prof.id ||
                p.id === `prod_${prof.id}` ||
                (p.name === prof.name && prof.phone && p.phone === prof.phone)
            );
            if (!existsForProfile) {
              const synthesized = buildProducerFromUser({
                id: prof.id,
                name: prof.name || prof.email?.split('@')[0] || 'Vendedor',
                email: prof.email || '',
                role: 'producer',
                phone: prof.phone || '',
                city: prof.city || 'Queimados',
                neighborhood: prof.neighborhood || 'Queimados',
                avatar: prof.avatar || '',
                avatarBgColor: prof.avatar_bg_color || '#4E553D',
                createdAt: prof.created_at || new Date().toISOString(),
              });
              map.set(synthesized.id, synthesized);
            }
          }
        }

        merged = Array.from(map.values());
      } catch {
        // fallback to merged local/API list
      }
    }

    const finalProducers = reconcileProducersWithUsers(merged, remoteUsers);
    StorageService.setProducers(finalProducers);
    return finalProducers;
  },

  async upsert(producer: Producer, authUserId?: string): Promise<boolean> {
    StorageService.saveProducer(producer);

    if (!supabase) {
      return true;
    }

    try {
      const row: any = {
        id: producer.id,
        name: producer.name,
        farm_name: producer.farmName,
        tagline: producer.tagline || '',
        bio: producer.bio || '',
        story: producer.story || '',
        avatar: producer.avatar || '',
        cover_image: producer.coverImage || '',
        gallery_images: producer.galleryImages || [],
        city: producer.location?.city || 'Queimados',
        state: producer.location?.state || 'RJ',
        neighborhood: producer.location?.neighborhood || 'Queimados',
        address: producer.location?.address || '',
        distance_km: producer.location?.distanceKm ?? 1.0,
        rating: producer.rating ?? 0,
        review_count: producer.reviewCount ?? 0,
        certifications: producer.certifications || [],
        phone: producer.phone || '',
        whatsapp: producer.whatsapp || '',
        established_year: producer.establishedYear || new Date().getFullYear(),
        harvest_days: producer.harvestDays || [],
        delivery_methods: producer.deliveryMethods || [],
        hectares: producer.hectares ?? null,
        specialty: producer.specialty || '',
        views_count: producer.viewsCount || 0,
        category: producer.category || 'outros',
      };
      if (authUserId) {
        row.user_id = authUserId;
      }

      const { error } = await supabase.from('producers').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  },

  async update(id: string, updates: Partial<Producer>): Promise<boolean> {
    const all = StorageService.getProducers();
    const existing = all.find(p => p.id === id);
    if (existing) {
      StorageService.saveProducer({ ...existing, ...updates });
    }

    if (!supabase) {
      return true;
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.farmName !== undefined) updateData.farm_name = updates.farmName;
      if (updates.tagline !== undefined) updateData.tagline = updates.tagline;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.story !== undefined) updateData.story = updates.story;
      if (updates.specialty !== undefined) updateData.specialty = updates.specialty;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.whatsapp !== undefined) updateData.whatsapp = updates.whatsapp;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.coverImage !== undefined) updateData.cover_image = updates.coverImage;
      if (updates.galleryImages !== undefined) updateData.gallery_images = updates.galleryImages;
      if (updates.location?.address !== undefined) updateData.address = updates.location.address;
      if (updates.location?.neighborhood !== undefined) updateData.neighborhood = updates.location.neighborhood;
      if (updates.location?.city !== undefined) updateData.city = updates.location.city;
      if (updates.location?.state !== undefined) updateData.state = updates.location.state;

      const { error } = await supabase
        .from('producers')
        .update(updateData)
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  }
};

// ==============================================================================
// 3. SERVIÇO DE PRODUTOS
// ==============================================================================
export const productsService = {
  async getAll(): Promise<Product[]> {
    const localProducts = StorageService.getProducts();
    if (!supabase) {
      try {
        const resp = await fetch('/api/products');
        if (resp.ok) {
          const apiProds = await resp.json();
          if (Array.isArray(apiProds) && apiProds.length > 0) {
            const map = new Map<string, Product>();
            for (const p of localProducts) map.set(p.id, p);
            for (const p of apiProds) if (p?.id) map.set(p.id, p);
            const merged = Array.from(map.values());
            StorageService.setProducts(merged);
            return merged;
          }
        }
      } catch {
        // ignore
      }
      return localProducts;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return localProducts;
      }

      const mapped = data.map((item: any) => ({
        id: item.id,
        producerId: item.producer_id,
        producerName: item.producer_name,
        producerFarm: item.producer_farm,
        producerDistanceKm: Number(item.producer_distance_km || 0),
        title: item.title,
        description: item.description || '',
        price: Number(item.price || 0),
        unit: item.unit || 'un',
        category: item.category,
        images: item.images || [],
        stock: Number(item.stock || 0),
        harvestDate: item.harvest_date || '',
        organic: Boolean(item.organic),
        certifications: item.certifications || [],
        nutritionHighlights: item.nutrition_highlights || [],
        freshnessScore: Number(item.freshness_score || 10),
        isSeasonal: Boolean(item.is_seasonal),
        featured: Boolean(item.featured),
        storageTips: item.storage_tips || '',
        clicksCount: Number(item.clicks_count || 0),
        ordersCount: Number(item.orders_count || 0)
      }));
      if (mapped.length > 0) {
        StorageService.setProducts(mapped);
      }
      return mapped.length > 0 ? mapped : localProducts;
    } catch {
      return localProducts;
    }
  },

  async create(product: Product): Promise<Product> {
    if (!supabase) {
      StorageService.saveProduct(product);
      return product;
    }

    try {
      const row = {
        id: product.id,
        producer_id: product.producerId,
        producer_name: product.producerName,
        producer_farm: product.producerFarm,
        producer_distance_km: product.producerDistanceKm || 0,
        title: product.title,
        description: product.description,
        price: product.price,
        unit: product.unit,
        category: product.category,
        images: product.images,
        stock: product.stock,
        harvest_date: product.harvestDate,
        organic: product.organic,
        certifications: product.certifications,
        nutrition_highlights: product.nutritionHighlights,
        freshness_score: product.freshnessScore,
        is_seasonal: product.isSeasonal,
        featured: product.featured,
        storage_tips: product.storageTips
      };

      const { data, error } = await supabase
        .from('products')
        .insert(row)
        .select()
        .single();

      if (error) {
        StorageService.saveProduct(product);
        return product;
      }
      return product;
    } catch {
      StorageService.saveProduct(product);
      return product;
    }
  },

  async update(id: string, product: Partial<Product>): Promise<boolean> {
    if (!supabase) {
      const all = StorageService.getProducts();
      const existing = all.find(p => p.id === id);
      if (existing) {
        StorageService.saveProduct({ ...existing, ...product });
      }
      return true;
    }

    try {
      const updateData: any = {};
      if (product.title) updateData.title = product.title;
      if (product.price !== undefined) updateData.price = product.price;
      if (product.stock !== undefined) updateData.stock = product.stock;
      if (product.description !== undefined) updateData.description = product.description;
      if (product.images) updateData.images = product.images;
      if (product.unit) updateData.unit = product.unit;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!supabase) {
      StorageService.deleteProduct(id);
      return true;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      StorageService.deleteProduct(id);
      return !error;
    } catch {
      StorageService.deleteProduct(id);
      return true;
    }
  }
};

// ==============================================================================
// 4. SERVIÇO DE PEDIDOS (ORDERS)
// ==============================================================================
export const ordersService = {
  async getAll(): Promise<Order[]> {
    if (!supabase) {
      return StorageService.getOrders();
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return StorageService.getOrders();
      }

      return data.map((item: any) => ({
        id: item.id,
        createdAt: item.created_at,
        customerName: item.customer_name,
        customerPhone: item.customer_phone,
        customerEmail: item.customer_email,
        customerAddress: item.customer_address,
        items: item.items || [],
        totalAmount: Number(item.total_amount || 0),
        deliveryFee: Number(item.delivery_fee || 0),
        deliveryType: item.delivery_type,
        pickupLocation: item.pickup_location,
        paymentMethod: item.payment_method,
        paymentStatus: item.payment_status,
        status: item.status,
        trackingCode: item.tracking_code || '',
        harvestBatchNote: item.harvest_batch_note || '',
        producerIds: item.producer_ids || []
      }));
    } catch {
      return StorageService.getOrders();
    }
  },

  async create(order: Order): Promise<boolean> {
    StorageService.saveOrder(order);

    if (!supabase) {
      return true;
    }

    try {
      const row = {
        id: order.id,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_email: order.customerEmail,
        customer_address: order.customerAddress,
        items: order.items,
        total_amount: order.totalAmount,
        delivery_fee: order.deliveryFee,
        delivery_type: order.deliveryType,
        pickup_location: order.pickupLocation,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        status: order.status,
        tracking_code: order.trackingCode,
        harvest_batch_note: order.harvestBatchNote,
        producer_ids: order.producerIds,
        created_at: order.createdAt
      };

      const { error } = await supabase.from('orders').insert(row);
      return !error;
    } catch {
      return true;
    }
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<boolean> {
    StorageService.updateOrderStatus(orderId, status);

    if (!supabase) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      return !error;
    } catch {
      return true;
    }
  }
};

// ==============================================================================
// 5. SERVIÇO DE STORIES E VÍDEOS CURTOS
// ==============================================================================
export const storiesService = {
  async getActive(): Promise<ProducerStory[]> {
    if (!supabase) {
      return StorageService.getStories();
    }

    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          comments:story_comments(*)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error || !data) {
        return StorageService.getStories();
      }

      return data.map((item: any) => ({
        id: item.id,
        producerId: item.producer_id,
        producerName: item.producer_name,
        producerFarm: item.producer_farm,
        producerAvatar: item.producer_avatar,
        videoUrl: item.video_url,
        thumbnailUrl: item.thumbnail_url,
        title: item.title,
        caption: item.caption,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        likesCount: item.likes_count || 0,
        likedByUsers: item.liked_by_users || [],
        viewsCount: item.views_count || 0,
        tag: item.tag,
        comments: (item.comments || []).map((c: any) => ({
          id: c.id,
          userName: c.user_name,
          userAvatar: c.user_avatar,
          text: c.text,
          createdAt: c.created_at
        }))
      }));
    } catch {
      return StorageService.getStories();
    }
  },

  async create(story: ProducerStory): Promise<boolean> {
    StorageService.saveStory(story);

    if (!supabase) {
      return true;
    }

    try {
      const row = {
        id: story.id,
        producer_id: story.producerId,
        producer_name: story.producerName,
        producer_farm: story.producerFarm,
        producer_avatar: story.producerAvatar,
        video_url: story.videoUrl,
        thumbnail_url: story.thumbnailUrl,
        title: story.title,
        caption: story.caption,
        created_at: story.createdAt,
        expires_at: story.expiresAt,
        likes_count: story.likesCount,
        liked_by_users: story.likedByUsers || [],
        views_count: story.viewsCount || 0,
        tag: story.tag
      };

      const { error } = await supabase.from('stories').insert(row);
      return !error;
    } catch {
      return true;
    }
  },

  async like(storyId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const localResult = StorageService.likeStory(storyId, userId);

    if (supabase) {
      try {
        const { data: story } = await supabase
          .from('stories')
          .select('liked_by_users, likes_count')
          .eq('id', storyId)
          .single();

        if (story) {
          const list: string[] = story.liked_by_users || [];
          const idx = list.indexOf(userId);
          let newCount = story.likes_count || 0;

          if (idx >= 0) {
            list.splice(idx, 1);
            newCount = Math.max(0, newCount - 1);
          } else {
            list.push(userId);
            newCount += 1;
          }

          await supabase
            .from('stories')
            .update({ liked_by_users: list, likes_count: newCount })
            .eq('id', storyId);
        }
      } catch (err) {
        console.warn('Supabase story like error:', err);
      }
    }

    return localResult;
  },

  async addComment(storyId: string, comment: StoryComment): Promise<boolean> {
    StorageService.addStoryComment(storyId, comment);

    if (!supabase) {
      return true;
    }

    try {
      const { error } = await supabase.from('story_comments').insert({
        id: comment.id,
        story_id: storyId,
        user_name: comment.userName,
        user_avatar: comment.userAvatar,
        text: comment.text,
        created_at: comment.createdAt
      });
      return !error;
    } catch {
      return true;
    }
  }
};

// ==============================================================================
// 6. SERVIÇO DE AVALIAÇÕES (REVIEWS)
// ==============================================================================
export const reviewsService = {
  async getByProducer(producerId: string): Promise<ReviewItem[]> {
    if (!supabase) {
      return StorageService.getReviewsForProducer(producerId);
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('producer_id', producerId)
        .order('date', { ascending: false });

      if (error || !data) {
        return StorageService.getReviewsForProducer(producerId);
      }

      return data.map((item: any) => ({
        id: item.id,
        producerId: item.producer_id,
        producerName: item.producer_name,
        productId: item.product_id || undefined,
        productTitle: item.product_title || undefined,
        targetType: item.target_type || (item.product_id ? 'product' : 'store'),
        authorName: item.author_name,
        authorAvatar: item.author_avatar,
        rating: item.rating,
        comment: item.comment,
        photos: Array.isArray(item.photos) ? item.photos : [],
        date: item.date,
        verifiedPurchase: Boolean(item.verified_purchase),
        helpfulCount: item.helpful_count || 0
      }));
    } catch {
      return StorageService.getReviewsForProducer(producerId);
    }
  },

  async addReview(review: ReviewItem): Promise<boolean> {
    StorageService.addReview(review);

    if (!supabase) {
      return true;
    }

    try {
      const row = {
        id: review.id,
        producer_id: review.producerId,
        producer_name: review.producerName,
        product_id: review.productId || null,
        product_title: review.productTitle || null,
        target_type: review.targetType || (review.productId ? 'product' : 'store'),
        author_name: review.authorName,
        author_avatar: review.authorAvatar,
        rating: review.rating,
        comment: review.comment,
        photos: review.photos || [],
        date: review.date,
        verified_purchase: review.verifiedPurchase,
        helpful_count: review.helpfulCount || 0
      };

      const { error } = await supabase.from('reviews').insert(row);
      return !error;
    } catch {
      return true;
    }
  }
};

// ==============================================================================
// 7. SERVIÇO DE CHAT
// ==============================================================================
export const chatService = {
  async getMessages(recipientId?: string): Promise<ChatMessage[]> {
    if (!supabase) {
      return StorageService.getChats();
    }

    try {
      let query = supabase.from('chat_messages').select('*').order('timestamp');
      if (recipientId) {
        query = query.or(`recipient_id.eq.${recipientId},sender_id.eq.${recipientId}`);
      }
      const { data, error } = await query;
      if (error || !data) {
        return StorageService.getChats();
      }
      return data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        recipientId: m.recipient_id,
        text: m.text,
        productRef: m.product_ref,
        timestamp: m.timestamp
      }));
    } catch {
      return StorageService.getChats();
    }
  },

  async sendMessage(msg: ChatMessage): Promise<boolean> {
    StorageService.sendChatMessage(msg);

    if (!supabase) {
      return true;
    }

    try {
      const { error } = await supabase.from('chat_messages').insert({
        id: msg.id,
        sender_id: msg.senderId,
        sender_name: msg.senderName,
        sender_role: msg.senderRole,
        recipient_id: msg.recipientId,
        text: msg.text,
        product_ref: msg.productRef,
        timestamp: msg.timestamp
      });
      return !error;
    } catch {
      return true;
    }
  }
};

// ==============================================================================
// 8. SERVIÇO DE SELOS E CATEGORIAS
// ==============================================================================
export const sealsService = {
  async getAll(): Promise<SealItem[]> {
    if (!supabase) return StorageService.getSeals();
    try {
      const { data, error } = await supabase.from('seals').select('*');
      if (error || !data || data.length === 0) return StorageService.getSeals();
      return data.map((s: any) => ({
        id: s.id,
        title: s.title,
        badge: s.badge,
        description: s.description,
        icon: s.icon,
        color: s.color,
        activeCount: s.active_count || 0
      }));
    } catch {
      return StorageService.getSeals();
    }
  }
};

export const categoriesService = {
  async getAll(): Promise<CategoryDef[]> {
    if (!supabase) return StorageService.getCategories();
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error || !data || data.length === 0) return StorageService.getCategories();
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        count: c.count || 0,
        color: c.color
      }));
    } catch {
      return StorageService.getCategories();
    }
  }
};

// ==============================================================================
// 8B. SERVIÇO DE AVALIAÇÕES PRIVADAS DO APLICATIVO (VISÍVEL APENAS AO ADMIN)
// ==============================================================================
export const appFeedbacksService = {
  async add(feedback: AppFeedback): Promise<boolean> {
    StorageService.addAppFeedback(feedback);

    if (!supabase) {
      return true;
    }

    try {
      const { error } = await supabase.from('app_feedbacks').insert({
        id: feedback.id,
        user_id: feedback.userId,
        user_name: feedback.userName,
        user_email: feedback.userEmail,
        user_role: feedback.userRole,
        user_neighborhood: feedback.userNeighborhood || null,
        rating: feedback.rating,
        experience: feedback.experience,
        comment: feedback.comment || null,
        suggestion: feedback.suggestion || null,
        created_at: feedback.createdAt,
        status: feedback.status
      });
      return !error;
    } catch {
      return true;
    }
  },

  async getAllForAdmin(): Promise<AppFeedback[]> {
    if (!supabase) {
      return StorageService.getAppFeedbacks();
    }

    try {
      const { data, error } = await supabase
        .from('app_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return StorageService.getAppFeedbacks();
      }

      return data.map((f: any) => ({
        id: f.id,
        userId: f.user_id,
        userName: f.user_name,
        userEmail: f.user_email,
        userRole: f.user_role,
        userNeighborhood: f.user_neighborhood || undefined,
        rating: Number(f.rating),
        experience: f.experience,
        comment: f.comment || undefined,
        suggestion: f.suggestion || undefined,
        createdAt: f.created_at,
        status: f.status || 'novo'
      }));
    } catch {
      return StorageService.getAppFeedbacks();
    }
  },

  async updateStatus(feedbackId: string, status: AppFeedback['status']): Promise<boolean> {
    StorageService.updateAppFeedbackStatus(feedbackId, status);

    if (!supabase) {
      return true;
    }

    try {
      const { error } = await supabase
        .from('app_feedbacks')
        .update({ status })
        .eq('id', feedbackId);
      return !error;
    } catch {
      return true;
    }
  }
};

// ==============================================================================
// 9. DIAGNÓSTICO E VALIDAÇÃO DE CONEXÃO
// ==============================================================================
export interface SupabaseDiagnosticResult {
  isConfigured: boolean;
  supabaseUrl: string;
  hasAnonKey: boolean;
  connected: boolean;
  latencyMs?: number;
  tables: {
    name: string;
    accessible: boolean;
    count?: number;
    error?: string;
  }[];
  message: string;
}

export const checkSupabaseConnection = async (): Promise<SupabaseDiagnosticResult> => {
  const configured = isSupabaseConfigured();
  const maskedUrl = supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'Não configurado';

  if (!configured || !supabase) {
    return {
      isConfigured: false,
      supabaseUrl: maskedUrl,
      hasAnonKey: Boolean(supabaseAnonKey),
      connected: false,
      tables: [],
      message: 'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ainda não foram configuradas com as credenciais do seu projeto. O app está operando em Modo Local (resiliente).'
    };
  }

  const startTime = performance.now();
  const tablesToCheck = ['products', 'producers', 'orders', 'categories', 'seals', 'profiles'];
  const tableResults: SupabaseDiagnosticResult['tables'] = [];

  let anySuccess = false;

  for (const tableName of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        tableResults.push({
          name: tableName,
          accessible: false,
          error: error.message
        });
      } else {
        anySuccess = true;
        tableResults.push({
          name: tableName,
          accessible: true,
          count: count ?? 0
        });
      }
    } catch (err: any) {
      tableResults.push({
        name: tableName,
        accessible: false,
        error: err?.message || 'Falha na requisição'
      });
    }
  }

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    isConfigured: true,
    supabaseUrl: maskedUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
    connected: anySuccess,
    latencyMs,
    tables: tableResults,
    message: anySuccess
      ? `Conexão ativa e operando com sucesso! Tempo de resposta: ${latencyMs}ms.`
      : 'As credenciais foram detectadas, mas as tabelas ainda não responderam. Verifique se executou o script supabase/schema.sql no SQL Editor do Supabase.'
  };
};
