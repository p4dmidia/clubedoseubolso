import { describe, it, expect } from 'vitest';

// -------------------------------------------------------------
// Pure TS implementations of the core business logic from database & webhook
// to be unit-tested.
// -------------------------------------------------------------

interface Affiliate {
  userId: string;
  createdAt: Date;
  activeUntil?: Date;
  referralsInLast30Days: number;
  subscriptionStatus: 'active' | 'inadimplente' | 'inactive';
  cpf: string;
  email: string;
}

interface Order {
  id: string;
  totalAmount: number;
  customerCpf: string;
  customerEmail: string;
  referralCode?: string;
}

interface CommissionConfig {
  type: 'percent' | 'fixed';
  levels: { level: number; value: number }[];
  activeGenerations: number;
}

// 1. is_affiliate_active function logic
export function isAffiliateActive(affiliate: Affiliate, now = new Date()): boolean {
  // Grace onboarding period of 30 days from creation
  const gracePeriodEnd = new Date(affiliate.createdAt.getTime());
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);
  if (now < gracePeriodEnd) {
    return true;
  }

  // Manual activation until a future date
  if (affiliate.activeUntil && now < affiliate.activeUntil) {
    return true;
  }

  // Active if referred at least 1 client in the last 30 days
  if (affiliate.referralsInLast30Days > 0) {
    return true;
  }

  return false;
}

// 2. processAffiliateAndCommissions logic
export function calculateCommissions(
  order: Order,
  affiliate: Affiliate,
  masterId: string,
  config: CommissionConfig
) {
  // A. Anti-fraud check: self-referral
  if (affiliate.cpf === order.customerCpf || affiliate.email === order.customerEmail) {
    return {
      status: 'blocked',
      reason: 'self_referral_abuse',
      commissions: []
    };
  }

  // B. Subscription Status (Inadimplência)
  let targetUserId = affiliate.userId;
  let redirectedToMaster = false;
  if (affiliate.subscriptionStatus === 'inadimplente') {
    targetUserId = masterId;
    redirectedToMaster = true;
  }

  // C. Calculate for active generations
  const commissions: any[] = [];
  let currentGen = 1;

  while (currentGen <= config.activeGenerations) {
    const levelConfig = config.levels.find(l => l.level === currentGen);
    if (levelConfig && levelConfig.value > 0) {
      let amount = levelConfig.value;
      if (config.type === 'percent') {
        amount = order.totalAmount * (levelConfig.value / 100);
      }

      // Check if affiliate is active to define status/destination
      const isActive = isAffiliateActive(affiliate);
      const destination = isActive ? 'available_balance' : 'frozen_balance';

      commissions.push({
        userId: redirectedToMaster ? masterId : targetUserId,
        amount,
        level: currentGen,
        destination,
        description: redirectedToMaster
          ? `Comissão MMN (Redirecionada ao Master devido a Patrocinador inativo) - Geração ${currentGen} - Pedido ${order.id}`
          : isActive
          ? `Comissão Geral Geração ${currentGen} - Pedido ${order.id}`
          : `Comissão Geral Geração ${currentGen} (Acumulado via GD Finance) - Pedido ${order.id}`
      });
    }
    currentGen++;
  }

  return {
    status: 'success',
    commissions
  };
}

// 3. User Upgrade rules
export function checkUpgradeEligibility(order: Order): { shouldUpgrade: boolean; role?: string; subscriptionStatus?: string } {
  if (order.totalAmount === 197) {
    return {
      shouldUpgrade: true,
      role: 'affiliate',
      subscriptionStatus: 'active'
    };
  }
  return { shouldUpgrade: false };
}

// -------------------------------------------------------------
// Test Cases
// -------------------------------------------------------------
describe('Regras de Atividade do Afiliado (isAffiliateActive)', () => {
  it('deve considerar ativo se cadastrado há menos de 30 dias (onboarding grátis)', () => {
    const now = new Date('2026-07-03T12:00:00Z');
    const affiliate: Affiliate = {
      userId: 'user-1',
      createdAt: new Date('2026-06-15T12:00:00Z'), // 18 dias atrás
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '123.456.789-00',
      email: 'affiliate@test.com'
    };

    expect(isAffiliateActive(affiliate, now)).toBe(true);
  });

  it('deve considerar inativo se cadastrado há mais de 30 dias sem indicações ou active_until', () => {
    const now = new Date('2026-07-03T12:00:00Z');
    const affiliate: Affiliate = {
      userId: 'user-1',
      createdAt: new Date('2026-05-01T12:00:00Z'), // > 60 dias atrás
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '123.456.789-00',
      email: 'affiliate@test.com'
    };

    expect(isAffiliateActive(affiliate, now)).toBe(false);
  });

  it('deve considerar ativo se active_until estiver no futuro', () => {
    const now = new Date('2026-07-03T12:00:00Z');
    const affiliate: Affiliate = {
      userId: 'user-1',
      createdAt: new Date('2026-05-01T12:00:00Z'),
      activeUntil: new Date('2026-08-01T12:00:00Z'), // Futuro
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '123.456.789-00',
      email: 'affiliate@test.com'
    };

    expect(isAffiliateActive(affiliate, now)).toBe(true);
  });

  it('deve considerar inativo se active_until estiver no passado', () => {
    const now = new Date('2026-07-03T12:00:00Z');
    const affiliate: Affiliate = {
      userId: 'user-1',
      createdAt: new Date('2026-05-01T12:00:00Z'),
      activeUntil: new Date('2026-06-01T12:00:00Z'), // Passado
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '123.456.789-00',
      email: 'affiliate@test.com'
    };

    expect(isAffiliateActive(affiliate, now)).toBe(false);
  });

  it('deve considerar ativo se tiver pelo menos 1 indicação nos últimos 30 dias', () => {
    const now = new Date('2026-07-03T12:00:00Z');
    const affiliate: Affiliate = {
      userId: 'user-1',
      createdAt: new Date('2026-05-01T12:00:00Z'),
      referralsInLast30Days: 1, // indicação recente
      subscriptionStatus: 'active',
      cpf: '123.456.789-00',
      email: 'affiliate@test.com'
    };

    expect(isAffiliateActive(affiliate, now)).toBe(true);
  });
});

describe('Regras de Distribuição de Comissões e Antifraude', () => {
  const masterId = 'master-admin-id';
  const testConfig: CommissionConfig = {
    type: 'percent',
    levels: [
      { level: 1, value: 10 }, // 10% Geração 1
      { level: 2, value: 5 }   // 5% Geração 2
    ],
    activeGenerations: 2
  };

  it('deve distribuir comissão com sucesso para afiliado ativo no saldo disponível', () => {
    const affiliate: Affiliate = {
      userId: 'affiliate-1',
      createdAt: new Date('2026-07-01T12:00:00Z'), // ativo no onboarding
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '111.111.111-11',
      email: 'affiliate1@test.com'
    };

    const order: Order = {
      id: 'order-100',
      totalAmount: 1000,
      customerCpf: '999.999.999-99',
      customerEmail: 'buyer@test.com',
      referralCode: 'aff1'
    };

    const result = calculateCommissions(order, affiliate, masterId, testConfig);

    expect(result.status).toBe('success');
    expect(result.commissions).toHaveLength(2);
    expect(result.commissions[0]).toEqual({
      userId: 'affiliate-1',
      amount: 100, // 10% de 1000
      level: 1,
      destination: 'available_balance',
      description: 'Comissão Geral Geração 1 - Pedido order-100'
    });
    expect(result.commissions[1].amount).toBe(50); // 5% de 1000
  });

  it('deve desviar comissão para saldo bloqueado se o afiliador estiver inativo', () => {
    const affiliate: Affiliate = {
      userId: 'affiliate-1',
      createdAt: new Date('2026-05-01T12:00:00Z'), // inativo (> 30 dias, sem indicações)
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '111.111.111-11',
      email: 'affiliate1@test.com'
    };

    const order: Order = {
      id: 'order-101',
      totalAmount: 500,
      customerCpf: '999.999.999-99',
      customerEmail: 'buyer@test.com'
    };

    const result = calculateCommissions(order, affiliate, masterId, testConfig);

    expect(result.status).toBe('success');
    expect(result.commissions[0].destination).toBe('frozen_balance');
    expect(result.commissions[0].userId).toBe('affiliate-1');
  });

  it('deve desviar a comissão totalmente para o Master se o afiliado estiver inadimplente', () => {
    const affiliate: Affiliate = {
      userId: 'affiliate-1',
      createdAt: new Date('2026-07-01T12:00:00Z'),
      referralsInLast30Days: 0,
      subscriptionStatus: 'inadimplente', // inadimplente
      cpf: '111.111.111-11',
      email: 'affiliate1@test.com'
    };

    const order: Order = {
      id: 'order-102',
      totalAmount: 1000,
      customerCpf: '999.999.999-99',
      customerEmail: 'buyer@test.com'
    };

    const result = calculateCommissions(order, affiliate, masterId, testConfig);

    expect(result.status).toBe('success');
    expect(result.commissions[0].userId).toBe(masterId);
    expect(result.commissions[0].description).toContain('Redirecionada ao Master devido a Patrocinador inativo');
  });

  it('deve bloquear comissão em caso de auto-indicação por CPF', () => {
    const affiliate: Affiliate = {
      userId: 'affiliate-1',
      createdAt: new Date('2026-07-01T12:00:00Z'),
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '111.111.111-11',
      email: 'affiliate1@test.com'
    };

    const order: Order = {
      id: 'order-103',
      totalAmount: 1000,
      customerCpf: '111.111.111-11', // CPF coincide com o do afiliado
      customerEmail: 'buyer@test.com'
    };

    const result = calculateCommissions(order, affiliate, masterId, testConfig);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('self_referral_abuse');
    expect(result.commissions).toHaveLength(0);
  });

  it('deve bloquear comissão em caso de auto-indicação por E-mail', () => {
    const affiliate: Affiliate = {
      userId: 'affiliate-1',
      createdAt: new Date('2026-07-01T12:00:00Z'),
      referralsInLast30Days: 0,
      subscriptionStatus: 'active',
      cpf: '111.111.111-11',
      email: 'affiliate1@test.com'
    };

    const order: Order = {
      id: 'order-104',
      totalAmount: 1000,
      customerCpf: '999.999.999-99',
      customerEmail: 'affiliate1@test.com' // E-mail coincide com o do afiliado
    };

    const result = calculateCommissions(order, affiliate, masterId, testConfig);

    expect(result.status).toBe('blocked');
    expect(result.reason).toBe('self_referral_abuse');
  });
});

describe('Regra de Upgrade de Assinatura', () => {
  it('deve sugerir upgrade para afiliado ativo se o pagamento for exatamente R$ 197', () => {
    const order: Order = {
      id: 'order-200',
      totalAmount: 197,
      customerCpf: '999.999.999-99',
      customerEmail: 'buyer@test.com'
    };

    const result = checkUpgradeEligibility(order);
    expect(result.shouldUpgrade).toBe(true);
    expect(result.role).toBe('affiliate');
    expect(result.subscriptionStatus).toBe('active');
  });

  it('não deve sugerir upgrade se o valor for diferente de R$ 197', () => {
    const order: Order = {
      id: 'order-201',
      totalAmount: 150,
      customerCpf: '999.999.999-99',
      customerEmail: 'buyer@test.com'
    };

    const result = checkUpgradeEligibility(order);
    expect(result.shouldUpgrade).toBe(false);
  });
});
