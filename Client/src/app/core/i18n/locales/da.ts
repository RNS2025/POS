import { en } from './en';

export type TranslationDictionary = typeof en;

export const da: TranslationDictionary = {
  landing: {
    nav: {
      features: 'Funktioner',
      howItWorks: 'Sådan virker det',
      pricing: 'Priser',
      login: 'Log ind',
      startShop: 'Kom i gang',
    },
    hero: {
      eyebrow: 'Samlet handel til moderne detail',
      title: 'Sælg overalt.',
      titleAccent: 'Styr det ét sted.',
      subtitle:
        'Platformen danske detailhandlere bruger til at samle online ordrer og butikssalg — uden kaos fra adskilte værktøjer.',
      ctaPrimary: 'Start din butik',
      ctaSecondary: 'Udforsk platformen',
    },
    stats: {
      channels: 'Salgskanaler',
      channelsValue: '2 → 1',
      setup: 'Typisk opsætning',
      setupValue: 'Minutter',
      support: 'Menneskelig support',
      supportValue: 'Inkluderet',
    },
    problem: {
      label: 'Den gamle måde',
      title: 'To systemer. Dobbelt arbejde.',
      problemText:
        'Separate webshops, separate kasser, separate supportaftaler — dit team lærer to gange og fejlsøger to gange.',
      solutionLabel: 'RNS-måden',
      solutionText:
        'Én tenant. Ét admin. Én guidet vej til go-live — med ægte mennesker når du har brug for det.',
    },
    steps: {
      title: 'Live på tre trin',
      step1Title: 'Reserver din butik',
      step1Desc: 'Registrer, vælg navn, og få din adresse på payment.rns-apps.dk.',
      step2Title: 'Følg playbooket',
      step2Desc: 'Trin-for-trin guides i admin — valgfri onboarding-samtale med vores team.',
      step3Title: 'Sælg uden at skifte',
      step3Desc: 'Online checkout og kasse i butikken, samlet under ét tag.',
    },
    features: {
      title: 'Bygget til hvordan du faktisk sælger',
      shopTitle: 'Onlinebutik',
      shopDesc: 'En butik dine kunder genkender — på din egen URL.',
      checkoutTitle: 'Online checkout',
      checkoutDesc: 'Hurtige, sikre betalinger fra telefon, tablet eller desktop.',
      kasseTitle: 'Kasse i butikken',
      kasseDesc: 'Disksalg med kortbetaling — samme ordrer, samme data.',
      adminTitle: 'Kommandocenter',
      adminDesc: 'Opsætning, indstillinger og status — ét dashboard, nul gætteri.',
    },
    trust: {
      title: 'Enterprise-grade fundament',
      gdpr: 'Tenant-isoleret by design',
      guided: 'Guidet onboarding, valgfri live support',
      support: 'EU-klar infrastruktur',
    },
    pricing: {
      title: 'Start gratis. Skaler når du er klar.',
      body: 'Ingen platform-niveauer at tyde. Opret din butik i dag — vi hjælper dig live på din tidslinje.',
    },
    cta: {
      title: 'Din næste kunde er allerede online.',
      body: 'Slut dig til detailhandlere der stoppede med at jonglere værktøjer og begyndte at vokse.',
      button: 'Start din butik',
    },
    footer: {
      tagline: 'Samlet butik + kasse til dansk detailhandel.',
      register: 'Opret butik',
      login: 'Log ind',
      contact: 'contact@rnsapps.dk',
      rights: 'Alle rettigheder forbeholdes.',
    },
  },
};
